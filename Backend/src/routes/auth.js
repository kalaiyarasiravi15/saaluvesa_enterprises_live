import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminUser } from "../models/index.js";
import "../config/env.js";

const router = Router();
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "saaluvesa_jwt_access_secret_2026_key";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "saaluvesa_jwt_refresh_secret_2026_key";

const access = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtAccessSecret,
    { expiresIn: "15m" },
  );
const refresh = (user) =>
  jwt.sign({ id: user.id, role: user.role }, jwtRefreshSecret, {
    expiresIn: "7d",
  });
router.post("/login", async (req, res, next) => {
  try {
    const user = await AdminUser.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const passwordOk = await bcrypt.compare(
      req.body.password || "",
      user.password_hash,
    );
    if (!passwordOk)
      return res.status(401).json({ message: "Incorrect password" });
    const refreshToken = refresh(user);
    await user.update({ refresh_token: refreshToken });
    res.json({
      accessToken: access(user),
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
});
router.post("/refresh", async (req, res, next) => {
  try {
    const payload = jwt.verify(
      req.body.refreshToken,
      jwtRefreshSecret,
    );
    const user = await AdminUser.findByPk(payload.id);
    if (!user || user.refresh_token !== req.body.refreshToken)
      return res.status(401).json({ message: "Refresh token rejected" });
    const refreshToken = refresh(user);
    await user.update({ refresh_token: refreshToken });
    res.json({ accessToken: access(user), refreshToken });
  } catch (e) {
    next(e);
  }
});
router.post("/logout", async (req, res, next) => {
  try {
    const user = await AdminUser.findOne({
      where: { refresh_token: req.body.refreshToken },
    });
    if (user) await user.update({ refresh_token: null });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
export default router;
