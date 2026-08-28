import nodemailer from "nodemailer";
import "dotenv/config";

const smtpUser = String(process.env.SMTP_USER || "").trim();
const smtpPassword = String(process.env.SMTP_PASSWORD || "").trim();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    smtpUser && smtpPassword
      ? { user: smtpUser, pass: smtpPassword }
      : undefined,
});

if (
  !process.env.SMTP_HOST ||
  !smtpUser ||
  !smtpPassword ||
  /example\.(com|org)$/.test(smtpUser) ||
  smtpUser.startsWith("your-")
) {
  console.warn(
    "[email] SMTP credentials in Backend/.env are missing or placeholders — contact-form emails will fail until real values are set.",
  );
}

export async function sendMail(message) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    throw new Error("Email service is not configured. Set SMTP_HOST and SMTP_FROM.");
  }

  if (!smtpUser || !smtpPassword) {
    throw new Error(
      "Gmail SMTP is not configured. Set SMTP_USER to your Gmail address and SMTP_PASSWORD to your app password.",
    );
  }

  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM,
      ...message,
    });
  } catch (error) {
    console.error("SMTP delivery failed:", error);
    throw error;
  }
}
