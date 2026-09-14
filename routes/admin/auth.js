import express from "express";
import bcrypt from "bcrypt";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { generateToken, requireAuth } from "../../lib/auth.js";
import { normalizeEmail, sanitizeText } from "../../lib/validate.js";
import { rateLimit } from "../../lib/rateLimit.js";

export const createAuthRouter = ({ adminRepo, auditRepo }) => {
  const router = express.Router();

  // Login throttling: max 10 attempts per IP per 15 minutes.
  const loginLimiter = rateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: "Too many login attempts. Please try again later.",
  });

  router.post(
    "/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (!email || !password) {
        throw new AppError(400, "Email and password are required");
      }

      const user = await adminRepo.findByEmail(email, true);
      if (!user || !user.isActive) {
        throw new AppError(401, "Invalid credentials");
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw new AppError(401, "Invalid credentials");
      }

      await adminRepo.touchLogin(user.id);
      const sanitized = { id: user.id, email: user.email, role: user.role };
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      try {
        await auditRepo.insert({
          actorId: user.id,
          action: "login",
          entityType: "user",
          entityId: user.id,
          ipAddress: req.ip || null,
          userAgent: (req.headers["user-agent"] || "").slice(0, 500),
        });
      } catch {
        /* auditing is non-fatal */
      }

      res.json({
        user: sanitized,
        token,
        expiresIn: "24h",
      });
    }),
  );

  router.get(
    "/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = await adminRepo.getById(req.user.id);
      if (!user) throw new AppError(401, "Session user no longer exists");
      res.json({ user });
    }),
  );

  // Simple self-service password change (admin authenticated).
  router.post(
    "/change-password",
    requireAuth,
    asyncHandler(async (req, res) => {
      const current = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
      const next = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      if (!current || !next) {
        throw new AppError(400, "Current and new passwords are required");
      }
      if (next.length < 8) {
        throw new AppError(400, "New password must be at least 8 characters");
      }
      const full = await adminRepo.findByEmail(req.user.email, true);
      if (!full || !(await bcrypt.compare(current, full.passwordHash))) {
        throw new AppError(400, "Current password is incorrect");
      }
      await adminRepo.setPassword(full.id, await bcrypt.hash(next, 12));
      try {
        await auditRepo.insert({
          actorId: full.id,
          action: "change_password",
          entityType: "user",
          entityId: full.id,
          ipAddress: req.ip || null,
          userAgent: (req.headers["user-agent"] || "").slice(0, 500),
        });
      } catch {
        /* non-fatal */
      }
      res.json({ message: "Password updated" });
    }),
  );

  return router;
};

export default createAuthRouter;