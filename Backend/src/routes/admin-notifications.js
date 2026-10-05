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

  try {
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
    return res.json({ notifications: notifications.filter((n) => n.submission), unreadCount });
  } catch (queryErr) {
    console.warn("Notifications query warning:", queryErr.message || queryErr);
    return res.json({ notifications: [], unreadCount: 0 });
  }
});

router.post("/read-all", async (_req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { is_read: false } });
    return res.json({ ok: true });
  } catch (err) {
    console.warn("Notifications read-all warning:", err.message || err);
    return res.json({ ok: false, message: err.message });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const row = await Notification.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Notification not found" });
    if (!row.is_read) {
      row.is_read = true;
      await row.save();
    }
    return res.json(row);
  } catch (err) {
    console.warn("Notification read patch warning:", err.message || err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
