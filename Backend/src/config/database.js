import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const databaseName = process.env.DB_NAME || "stsforce_saaluvesadata";
const rawPassword = process.env.DB_PASSWORD || "8#BW5Th!&e";
const dbPassword = rawPassword.replace(/^['"]|['"]$/g, "");
const dbUser = process.env.DB_USER || "stsforce_saaluvesauser";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT || 3306);

export const sequelize = new Sequelize(
  databaseName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: "mysql",
    logging: false,
  },
);

// Connect without selecting a schema so a new local installation can boot.
export async function ensureDatabase() {
  if (!/^[A-Za-z0-9_]+$/.test(databaseName))
    throw new Error(
      "DB_NAME may contain only letters, numbers, and underscores",
    );
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.end();
  } catch (err) {
    // cPanel MySQL user might not have global CREATE DATABASE permission, safe to proceed
  }
}
