import { Router } from "express";
import { Op } from "sequelize";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { Label } from "../models/label.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { cleanLabel, labelRevision } from "../middleware/validate-label.js";
import { uploadsDirectory } from "../utils/upload.js";
import { readImageMeta } from "../utils/image-meta.js";
import { translateLabel } from "../services/label-translation.js";

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

router.post("/translate", wrap(async (req, res) => {
  res.json(await translateLabel(req.body?.label, req.body?.languageCode));
}));

router.use(authenticate, requireRole("admin", "staff"));
async function checkLogos(sections) {
  for (const section of sections) {
    if (section.logoPath) {
      await fs.access(path.join(uploadsDirectory, path.basename(section.logoPath)))
        .catch(() => fail(422, "A logo is missing. Upload it again before saving."));
    }
    if (section.rightLogoPath) {
      await fs.access(path.join(uploadsDirectory, path.basename(section.rightLogoPath)))
        .catch(() => fail(422, "A right logo is missing. Upload it again before saving."));
    }
  }
}

router.post("/logos", (req, res, next) => {
  multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single("image")(req, res, (error) => {
    if (error) return next(Object.assign(new Error("Upload a PNG, JPEG or WebP logo smaller than 2 MB."), { status: 422 }));
    next();
  });
}, wrap(async (req, res) => {
  const buffer = req.file?.buffer;
  if (!buffer) fail(422, "Choose a logo image.");
  const meta = readImageMeta(buffer);
  const ext = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png"
    : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 ? "jpg"
    : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
  if (!ext || !meta || meta.width < 1 || meta.height < 1 || meta.width > 1024 || meta.height > 1024) fail(422, "Upload a valid logo no larger than 1024 × 1024 pixels.");
  const name = `label-${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(uploadsDirectory, name), buffer, { flag: "wx" });
  res.status(201).json({ path: `/uploads/${name}` });
}));

router.get("/", wrap(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const search = String(req.query.search || "").trim().slice(0, 200);
  const { rows, count } = await Label.findAndCountAll({
    where: search ? { title: { [Op.like]: `%${search}%` } } : {},
    order: [["updatedAt", "DESC"], ["id", "DESC"]], limit: 10, offset: (page - 1) * 10,
  });
  res.json({ items: rows, total: count, page, pageSize: 10 });
}));

router.post("/", wrap(async (req, res) => {
  const data = cleanLabel(req.body);
  await checkLogos(data.sections);
  const label = await Label.create({ ...data, created_by: req.user.id, updated_by: req.user.id });
  res.status(201).json(label);
}));

router.param("id", (req, _res, next, id) => {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return next(Object.assign(new Error("Invalid label ID."), { status: 422 }));
  next();
});
router.get("/:id", wrap(async (req, res) => {
  const label = await Label.findByPk(req.params.id);
  if (!label) fail(404, "Label not found.");
  res.json(label);
}));
router.put("/:id", wrap(async (req, res) => {
  const data = cleanLabel(req.body);
  const revision = labelRevision(req.body.revision);
  await checkLogos(data.sections);
  const [count] = await Label.update({ ...data, revision: revision + 1, updated_by: req.user.id }, {
    where: { id: req.params.id, revision },
  });
  if (!count) {
    if (!await Label.findByPk(req.params.id)) fail(404, "This label was deleted. Start a new label to save a copy.");
    fail(409, "Someone else updated this label. Your draft is preserved. Reload the saved label before editing again.");
  }
  // Return this write's revision, not a later concurrent write.
  res.json({ ...data, id: Number(req.params.id), revision: revision + 1 });
}));
router.delete("/:id", wrap(async (req, res) => {
  const revision = labelRevision(req.body?.revision);
  const count = await Label.destroy({ where: { id: req.params.id, revision } });
  if (!count) {
    if (!await Label.findByPk(req.params.id)) fail(404, "Label not found.");
    fail(409, "This label changed. Refresh the saved labels before deleting it.");
  }
  res.status(204).end();
}));
export default router;
