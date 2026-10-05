import { sequelize } from "../config/database.js";
import { Label } from "../models/label.js";

try {
  await sequelize.authenticate();
  await Label.sync();
  console.log("Labels table is ready. Existing tables were not changed.");
} finally {
  await sequelize.close();
}
