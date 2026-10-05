import fs from "node:fs/promises";
import path from "node:path";
import { sequelize } from "../config/database.js";
import { Label } from "../models/label.js";
import { uploadsDirectory } from "../utils/upload.js";

// Run during a maintenance window: protect recent uploads and every saved reference.
try {
  const labels = await Label.findAll({ attributes: ["sections"] });
  const referenced = new Set(labels.flatMap((label) => label.sections.flatMap((section) => [section.logoPath, section.rightLogoPath].filter(Boolean))));
  let removed = 0;
  for (const name of await fs.readdir(uploadsDirectory)) {
    if (!/^label-[a-f0-9-]+\.(png|jpg|webp)$/.test(name) || referenced.has(`/uploads/${name}`)) continue;
    const file = path.join(uploadsDirectory, name);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || Date.now() - stat.mtimeMs < 7 * 24 * 60 * 60 * 1000) continue;
    await fs.unlink(file);
    removed++;
  }
  console.log(`Removed ${removed} unreferenced label logos older than seven days.`);
} finally { await sequelize.close(); }
