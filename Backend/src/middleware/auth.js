import jwt from "jsonwebtoken";
import "../config/env.js";

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "saaluvesa_jwt_access_secret_2026_key";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token)
    return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, jwtAccessSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ message: "Insufficient permissions" });
