import bcrypt from "bcrypt";
import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";
import { normalizeEmail, sanitizeText } from "../../lib/validate.js";

export const createUsersAdminRouter = ({ adminRepo, auditRepo }) => {
  const router = express.Router();
  // User management is a privileged, admin-only module: even listing
  // accounts is restricted to the admin role.
  router.use(requireAuth, requireRole("admin"));
  const audit = makeAuditLogger(auditRepo);

  const asId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json({ users: await adminRepo.list() });
    }),
  );

  router.post(
    "/",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const role = ["admin", "editor"].includes(req.body?.role) ? req.body.role : "editor";
      if (!email) throw new AppError(400, "A valid email is required");
      if (password.length < 8) throw new AppError(400, "Password must be at least 8 characters");
      if (await adminRepo.findByEmail(email)) throw new AppError(409, "A user with this email already exists");
      const user = await adminRepo.create({
        email,
        displayName: sanitizeText(req.body?.displayName, 120) || email,
        passwordHash: await bcrypt.hash(password, 12),
        role,
      });
      await audit(req)({ action: "create", entityType: "user", entityId: user.id, newValues: { email, role } });
      res.status(201).json({ user });
    }),
  );

  router.patch(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid user id");
      const before = await adminRepo.getById(id);
      if (!before) throw new AppError(404, "User not found");
      const fields = {};
      if (req.body?.email !== undefined) {
        const email = normalizeEmail(req.body.email);
        if (!email) throw new AppError(400, "A valid email is required");
        const others = await adminRepo.list().then((list) => list.find((u) => u.id !== id && u.email === email));
        if (others) throw new AppError(409, "A user with this email already exists");
        fields.email = email;
      }
      if (req.body?.role !== undefined) {
        if (!["admin", "editor"].includes(req.body.role)) throw new AppError(400, "Invalid role");
        fields.role = req.body.role;
      }
      if (req.body?.displayName !== undefined) fields.displayName = sanitizeText(req.body.displayName, 120) || null;
      if (req.body?.isActive !== undefined) fields.isActive = Boolean(req.body.isActive);
      if (req.body?.password) {
        await adminRepo.setPassword(id, await bcrypt.hash(req.body.password, 12));
      }
      const user = await adminRepo.update(id, fields);
      await audit(req)({ action: "update", entityType: "user", entityId: id, oldValues: { email: before.email, role: before.role } });
      res.json({ user });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid user id");
      if (id === req.user.id) throw new AppError(400, "You cannot delete your own account");
      const before = await adminRepo.getById(id);
      if (!before) throw new AppError(404, "User not found");
      await adminRepo.remove(id);
      await audit(req)({ action: "delete", entityType: "user", entityId: id, oldValues: { email: before.email } });
      res.status(204).end();
    }),
  );

  return router;
};

export default createUsersAdminRouter;