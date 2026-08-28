import { Router } from "express";
import { Notification, ContactSubmission, Product } from "../models/index.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, requireRole("admin", "staff"));

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 50);

  try {
    // Backfill any ContactSubmission missing a Notification
    const allSubmissions = await ContactSubmission.findAll({ attributes: ["id", "name", "status", "createdAt"] });
    const existingNotifs = await Notification.findAll({ attributes: ["contact_submission_id"] });
    const existingSubmissionIds = new Set(existingNotifs.map((n) => n.contact_submission_id));

    for (const sub of allSubmissions) {
      if (!existingSubmissionIds.has(sub.id)) {
        await Notification.create({
          title: `New enquiry from ${sub.name}`,
          contact_submission_id: sub.id,
          is_read: sub.status === "Responded",
          createdAt: sub.createdAt,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Notification backfill notice:", err.message);
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.findAll({
      include: [
        {
          model: ContactSubmission,
          as: "submission",
          include: [{ model: Product, attributes: ["id", "name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    }),
    Notification.count({ where: { is_read: false } }),
  ]);
  res.json({ notifications: notifications.filter((n) => n.submission), unreadCount });
});

router.post("/read-all", async (_req, res) => {
  await Notification.update({ is_read: true }, { where: { is_read: false } });
  res.json({ ok: true });
});

router.patch("/:id/read", async (req, res) => {  const row = await Notification.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: "Notification not found" });
  if (!row.is_read) {
    row.is_read = true;
    await row.save();
  }
  res.json(row);
});

export default router;
