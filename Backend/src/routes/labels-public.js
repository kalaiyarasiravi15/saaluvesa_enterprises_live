/**
 * Public Labels API — no authentication required.
 * Used by the frontend /labels page to display saved labels.
 */
import { Router } from "express";
import { Op } from "sequelize";
import { Label } from "../models/label.js";

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

router.get("/", wrap(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const search = String(req.query.search || "").trim().slice(0, 200);
  const { rows, count } = await Label.findAndCountAll({
    where: search ? { title: { [Op.like]: `%${search}%` } } : {},
    order: [["updatedAt", "DESC"], ["id", "DESC"]],
    limit: 10,
    offset: (page - 1) * 10,
  });
  res.json({ items: rows, total: count, page, pageSize: 10 });
}));

router.get("/:id", wrap(async (req, res) => {
  const id = req.params.id;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(422).json({ message: "Invalid label ID." });
  }
  const label = await Label.findByPk(id);
  if (!label) return res.status(404).json({ message: "Label not found." });
  res.json(label);
}));

export default router;
