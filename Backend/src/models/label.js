import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Label = sequelize.define("Label", {
  title: { type: DataTypes.STRING(200), allowNull: false },
  sections: { type: DataTypes.JSON, allowNull: false },
  schema_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
  updated_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "Labels", freezeTableName: true });
