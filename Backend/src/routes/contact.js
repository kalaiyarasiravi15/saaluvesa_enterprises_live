import { Router } from "express";
import { Product, ContactSubmission, Notification } from "../models/index.js";
import { validate } from "../middleware/validate.js";
import { sendMail } from "../services/email.js";

const router = Router();
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "contact@saaluvesa.com";

router.post(
  "/",
  validate(["name", "email", "address", "postal_code", "requirement_details"]),
  async (req, res, next) => {
    try {
      if (!/^\S+@\S+\.\S+$/.test(req.body.email)) {
        return res.status(422).json({ message: "Please provide a valid email address." });
      }
      const sourceProductId = req.body.product_id || null;
      const product = sourceProductId ? await Product.findByPk(sourceProductId) : null;
      const productName = product?.name || req.body.product_name || "General enquiry";

      const submission = await ContactSubmission.create({
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        postal_code: req.body.postal_code,
        requirement_details: req.body.requirement_details,
        source_product_id: sourceProductId,
        status: "New",
      });

      await Notification.create({
        title: `New enquiry from ${req.body.name}`,
        contact_submission_id: submission.id,
      });

      try {
        await sendMail({
          to: CONTACT_RECIPIENT,
          replyTo: req.body.email,
          subject: `New website enquiry from ${req.body.name}`,
          text: [
            `Name: ${req.body.name}`,
            `Email: ${req.body.email}`,
            `Address: ${req.body.address}`,
            `Postal code: ${req.body.postal_code}`,
            `Product: ${productName}`,
            "",
            "Requirement:",
            req.body.requirement_details,
          ].join("\n"),
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #0f172a; margin: 0; font-size: 20px;">New Website Contact Enquiry</h2>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Received via Saaluvesa Enterprises Storefront</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 9px 0; color: #64748b; width: 140px;"><strong>Customer Name:</strong></td><td style="padding: 9px 0; color: #0f172a; font-weight: 600;">${req.body.name}</td></tr>
                <tr><td style="padding: 9px 0; color: #64748b;"><strong>Email Address:</strong></td><td style="padding: 9px 0; color: #0284c7;"><a href="mailto:${req.body.email}" style="color: #0284c7; text-decoration: none;">${req.body.email}</a></td></tr>
                <tr><td style="padding: 9px 0; color: #64748b;"><strong>Delivery Address:</strong></td><td style="padding: 9px 0; color: #334155;">${req.body.address}</td></tr>
                <tr><td style="padding: 9px 0; color: #64748b;"><strong>Postal PIN Code:</strong></td><td style="padding: 9px 0; color: #334155;">${req.body.postal_code}</td></tr>
                <tr><td style="padding: 9px 0; color: #64748b;"><strong>Product / Service:</strong></td><td style="padding: 9px 0; color: #0f172a; font-weight: 500;">${productName}</td></tr>
              </table>
              <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #0f172a; border-radius: 6px;">
                <strong style="color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Requirement Details:</strong>
                <p style="margin: 8px 0 0 0; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${req.body.requirement_details}</p>
              </div>
              <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                Saaluvesa Enterprises Pvt Ltd • Automated Notification
              </div>
            </div>
          `,
        });
      } catch (mailError) {
        console.warn("Email delivery skipped or failed:", mailError.message);
      }

      return res.status(201).json({ message: "Your enquiry has been sent successfully." });
    } catch (error) {
      console.error("Contact enquiry failed:", error);
      return res.status(500).json({
        message: "We could not send your enquiry right now. Please try again shortly.",
      });
    }
  },
);

export { router as publicContact };
