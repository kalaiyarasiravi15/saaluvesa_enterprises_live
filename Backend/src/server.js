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
const app = express();

app.use(cors());
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
app.use("/api/auth", auth);
app.use("/api/products", publicProducts);
app.use("/api/contact", publicContact);
app.use("/api/admin/products", adminProducts);
app.use("/api/admin/export-documents", exportDocuments);
app.use("/api/admin/contact-submissions", adminContactSubmissions);
app.use("/api/admin/notifications", adminNotifications);

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

    const seeds = [
      {
        slug: "custom-tshirts",
        file: "product_custom.jpg",
        name: "Custom-printed t-shirts",
        description:
          "Tailored designs for families, groups, businesses, events and organizations, printed in DTF or DTG on premium cotton.",
        website_link: "https://castbull.co.in/",
      },
      {
        slug: "plain-tshirts",
        file: "product_plain.jpg",
        name: "Plain cotton t-shirts",
        description:
          "Bulk-ready blanks sourced from verified manufacturers, available across sizes and colors for retail or export.",
        website_link: "https://castbull.co.in/",
      },
      {
        slug: "personalized-merch",
        file: "product_merch.jpg",
        name: "Personalized apparel & merch",
        description:
          "Flexible sourcing and printing scaled from single-piece orders to large export consignments.",
        website_link: "https://castbull.co.in/",
      },
    ];
    for (const seed of seeds) {
      await Product.findOrCreate({
        where: { slug: seed.slug },
        defaults: {
          name: seed.name,
          description: seed.description,
          website_link: seed.website_link,
          slug: seed.slug,
          image: `/uploads/${seed.file}`,
        },
      });
    }
    console.log("✅ Auto-seeding completed successfully.");
  } catch (err) {
    console.warn("Auto-seed info:", err.message || err);
  }
}

const port = Number(process.env.PORT || 5000);

async function start() {
  await ensureDatabase();
  await sequelize.authenticate();
  if (process.env.DB_SYNC !== "false") {
    try {
      await sequelize.sync();
    } catch (syncErr) {
      console.warn("Sequelize schema sync info:", syncErr.message || syncErr);
    }
  }
  await autoSeed();
  app.listen(port, () => console.log(`Saaluvesa API listening on ${port}`));
}

start().catch((error) => {
  console.error("Database connection failed:", error);
  process.exit(1);
});
