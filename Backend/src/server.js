import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import "./config/env.js";
import { sequelize, ensureDatabase } from "./config/database.js";
import { AdminUser, Product, SiteSetting } from "./models/index.js";
import { uploadsDirectory } from "./utils/upload.js";
import auth from "./routes/auth.js";
import { publicProducts, adminProducts } from "./routes/products.js";
import { publicContact } from "./routes/contact.js";
import exportDocuments from "./routes/export-documents.js";
import adminContactSubmissions from "./routes/admin-contact-submissions.js";
import adminNotifications from "./routes/admin-notifications.js";
import labels from "./routes/labels.js";
import publicLabels from "./routes/labels-public.js";
import { publicBanner, adminBanner } from "./routes/banner.js";

process.on("unhandledRejection", (reason) => {
  console.warn("Global Unhandled Rejection (intercepted):", reason);
});
process.on("uncaughtException", (error) => {
  console.warn("Global Uncaught Exception (intercepted):", error);
});

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow requests without Origin, such as health checks and server-to-server calls.
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDirectory));

try {
  const swaggerJsdocModule = await import("swagger-jsdoc").catch(() => null);
  const swaggerUiModule = await import("swagger-ui-express").catch(() => null);
  if (swaggerJsdocModule && swaggerUiModule) {
    const swaggerJsdoc = swaggerJsdocModule.default || swaggerJsdocModule;
    const swaggerUi = swaggerUiModule.default || swaggerUiModule;
    const specification = swaggerJsdoc({
      definition: {
        openapi: "3.0.3",
        info: { title: "Saaluvesa API", version: "1.0.0" },
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          },
        },
      },
      apis: [],
    });
    specification.paths = {
      "/api/auth/login": { post: { summary: "Admin login" } },
      "/api/products": { get: { summary: "Public product catalogue" } },
      "/api/contact": { post: { summary: "Submit a public enquiry" } },
      "/api/admin/products": {
        get: { summary: "List products", security: [{ bearerAuth: [] }] },
        post: { summary: "Create product", security: [{ bearerAuth: [] }] },
      },
    };
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specification));
  }
} catch (e) {
  // Swagger optional
}
let isDbConnected = false;
let lastDbError = null;

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "Saaluvesa API",
    time: new Date().toISOString(),
    database: isDbConnected ? "connected" : "connecting_or_error",
  });
});

app.get(["/health", "/api/health"], (_req, res) => {
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "healthy" : "degraded",
    database: isDbConnected ? "connected" : "disconnected",
    dbError: lastDbError ? lastDbError.message : null,
    uptime: Math.round(process.uptime()),
  });
});

app.use("/api/auth", auth);
app.use("/api/products", publicProducts);
app.use("/api/contact", publicContact);
app.use("/api/admin/products", adminProducts);
app.use("/api/admin/export-documents", exportDocuments);
app.use("/api/admin/contact-submissions", adminContactSubmissions);
app.use("/api/admin/notifications", adminNotifications);
app.use("/api/admin/labels", labels);
app.use("/api/labels", publicLabels);
app.use("/api/banner", publicBanner);
app.use("/api/admin/banner", adminBanner);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === "MulterError") {
    return res.status(422).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image file is too large. Maximum allowed size is 10 MB."
          : "Image upload failed. Please try again.",
    });
  }
  if (err.name === "ImageUploadError") {
    return res.status(err.status || 422).json({ message: err.message });
  }
  if (
    err.name?.includes("Validation") ||
    err.name === "SequelizeUniqueConstraintError"
  )
    return res.status(422).json({
      message: err.errors?.map((e) => e.message).join(", ") || err.message,
    });
  if (err.status) return res.status(err.status).json({ message: err.message });
  res.status(500).json({ message: err.message || "Unexpected server error" });
});



async function autoSeed() {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@saaluvesa.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@2026";
    const existingAdmin = await AdminUser.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash(adminPassword, 12);
      await AdminUser.create({ email: adminEmail, password_hash, role: "admin" });
      console.log("✅ Default admin user created:", adminEmail);
    }

    const defaults = {
      office_name: "SAALUVESA ENTERPRISES PRIVATE LIMITED",
      office_address:
        "Dr.No.18/76, Thiru.Ve.Ka. St, Punjai Puliampatti, SATHYAMANGALAM, ERODE, TAMIL NADU. -638459",
      gst_number: "33ABRCS3304A1ZR",
      iec_number: "ABRCS3304A",
      contact_email: "contact@saaluvesa.com",
      live_support_number: "",
    };
    for (const [key, value] of Object.entries(defaults)) {
      await SiteSetting.findOrCreate({ where: { key }, defaults: { value } });
    }

    console.log("✅ Auto-seeding completed successfully.");
  } catch (err) {
    console.warn("Auto-seed info:", err.message || err);
  }
}

async function ensureTables() {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;").catch(() => {});

  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS \`AdminUsers\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`role\` ENUM('admin', 'staff') NOT NULL DEFAULT 'admin',
      \`refresh_token\` TEXT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Products\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`description\` TEXT NOT NULL,
      \`website_link\` VARCHAR(255) NULL,
      \`image\` TEXT NULL,
      \`images\` TEXT NULL DEFAULT NULL,
      \`display_order\` INT NOT NULL DEFAULT 0,
      \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
      \`slug\` VARCHAR(255) NOT NULL UNIQUE,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`ContactSubmissions\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL,
      \`phone\` VARCHAR(255) NULL,
      \`address\` TEXT NULL,
      \`postal_code\` VARCHAR(255) NULL,
      \`requirement_details\` TEXT NOT NULL,
      \`status\` ENUM('New', 'Responded') DEFAULT 'New',
      \`source_product_id\` INT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Notifications\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`type\` ENUM('contact_submission') NOT NULL DEFAULT 'contact_submission',
      \`title\` VARCHAR(255) NOT NULL,
      \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
      \`contact_submission_id\` INT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`SiteSettings\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`key\` VARCHAR(255) NOT NULL UNIQUE,
      \`value\` TEXT NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`ExportDocuments\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`invoice_no\` VARCHAR(255) NOT NULL UNIQUE,
      \`sender_name\` VARCHAR(255) NULL,
      \`sender_email\` VARCHAR(255) NULL,
      \`sender_address\` TEXT NULL,
      \`additional_company_details\` TEXT NULL,
      \`sender_contact\` VARCHAR(255) NULL,
      \`sender_tax_id\` VARCHAR(255) NULL,
      \`shipment_date\` DATE NULL,
      \`shipment_ref_no\` VARCHAR(255) NULL,
      \`reason_for_export\` VARCHAR(255) NULL,
      \`type_of_export\` VARCHAR(255) NULL,
      \`export_license_no\` VARCHAR(255) NULL,
      \`import_license_no\` VARCHAR(255) NULL,
      \`incoterms\` VARCHAR(255) NULL,
      \`currency_code\` VARCHAR(255) DEFAULT 'USD',
      \`payment_method\` VARCHAR(255) NULL,
      \`importer_name\` VARCHAR(255) NOT NULL,
      \`importer_address\` TEXT NULL,
      \`importer_contact\` VARCHAR(255) NULL,
      \`importer_email\` VARCHAR(255) NULL,
      \`importer_tax_id\` VARCHAR(255) NULL,
      \`receiver_name\` VARCHAR(255) NULL,
      \`receiver_email\` VARCHAR(255) NULL,
      \`receiver_address\` TEXT NULL,
      \`receiver_contact\` VARCHAR(255) NULL,
      \`receiver_tax_id\` VARCHAR(255) NULL,
      \`letter_of_credit_no\` VARCHAR(255) NULL,
      \`customer_po_no\` VARCHAR(255) NULL,
      \`po_date\` DATE NULL,
      \`file_number\` VARCHAR(255) NULL,
      \`mode_of_transportation\` VARCHAR(255) NULL,
      \`transportation_terms\` VARCHAR(255) NULL,
      \`awb_bl_no\` VARCHAR(255) NULL,
      \`no_of_packages\` INT NULL,
      \`package_description\` TEXT NULL,
      \`total_gross_weight_unit\` VARCHAR(255) NULL,
      \`hs_code\` VARCHAR(255) NULL,
      \`country_of_origin\` VARCHAR(255) NULL,
      \`other_information_compliance_details\` TEXT NULL,
      \`signatory_name\` VARCHAR(255) NULL,
      \`signatory_designation\` VARCHAR(255) NULL,
      \`total_goods_value\` DECIMAL(14,2) DEFAULT 0.00,
      \`tax_type\` VARCHAR(255) DEFAULT NULL,
      \`tax_rate\` DECIMAL(6,2) DEFAULT 0.00,
      \`tax_amount\` DECIMAL(14,2) DEFAULT 0.00,
      \`tax2_type\` VARCHAR(255) DEFAULT NULL,
      \`tax2_rate\` DECIMAL(6,2) DEFAULT 0.00,
      \`tax2_amount\` DECIMAL(14,2) DEFAULT 0.00,
      \`final_total_amount\` DECIMAL(14,2) DEFAULT 0.00,
      \`total_amount_words\` TEXT NULL,
      \`total_net_weight_kg\` DECIMAL(14,3) DEFAULT 0.000,
      \`total_net_weight_lbs\` DECIMAL(14,3) DEFAULT 0.000,
      \`status\` ENUM('Draft', 'Generated', 'Closed') DEFAULT 'Draft',
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`ExportDocumentItems\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`export_document_id\` INT NULL,
      \`hs_code\` VARCHAR(255) NULL,
      \`product_name\` VARCHAR(255) NOT NULL,
      \`country_of_origin\` VARCHAR(255) NULL,
      \`qty\` DECIMAL(12,3) NOT NULL,
      \`uom\` VARCHAR(255) NULL,
      \`unit_value\` DECIMAL(14,2) NOT NULL,
      \`extra_price\` DECIMAL(14,2) DEFAULT 0.00,
      \`sub_total\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      \`unit_net_weight\` DECIMAL(14,3) DEFAULT 0.000,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_items_export_document_id\` (\`export_document_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`ExportDocumentAudits\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`export_document_id\` INT NULL,
      \`edited_by\` INT NULL,
      \`edited_field\` VARCHAR(255) NOT NULL,
      \`old_value\` TEXT NULL,
      \`new_value\` TEXT NULL,
      \`edited_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_audits_export_document_id\` (\`export_document_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS \`Labels\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`title\` VARCHAR(200) NOT NULL,
      \`sections\` JSON NOT NULL,
      \`schema_version\` INT NOT NULL DEFAULT 1,
      \`revision\` INT NOT NULL DEFAULT 1,
      \`created_by\` INT NOT NULL,
      \`updated_by\` INT NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const query of tableDefinitions) {
    try {
      await sequelize.query(query);
    } catch (tblErr) {
      console.warn("Table auto-init note:", tblErr.message || tblErr);
    }
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;").catch(() => {});
}

async function start() {
  try {
    await ensureDatabase().catch(() => {});
    await sequelize.authenticate();
    isDbConnected = true;
    console.log("✅ Database authenticated successfully.");
    await ensureTables();
    if (process.env.DB_SYNC === "true") {
      try {
        await sequelize.sync();
      } catch (syncErr) {
        console.warn("Sequelize schema sync info:", syncErr.message || syncErr);
      }
    }
    await autoSeed();
  } catch (error) {
    isDbConnected = false;
    lastDbError = error;
    console.error("Database connection warning:", error.message || error);
  }

  const port = process.env.PORT || 30008;

  const server = app.listen(port, () => {
    console.log(`Saaluvesa API server listening on ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Error: Port ${port} is already in use by another process.`);
      console.error(`👉 Run in terminal to free port: killall -9 node`);
      console.error(`👉 Or: fuser -k ${port}/tcp`);
      console.error(`👉 Or click 'Restart' in Webuzo NodeJS Application Manager.\n`);
    } else {
      console.error("Server error:", err);
    }
  });
}

start();
