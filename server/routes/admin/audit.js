import express from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth, requireRole } from "../../lib/auth.js";

export const createAuditAdminRouter = ({ auditRepo }) => {
  const router = express.Router();
  // The audit log is privileged, admin-only: editors still CREATE audit
  // entries for their actions, but only admins may read the log.
  router.use(requireAuth, requireRole("admin"));

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(
        await auditRepo.list({
          actorId: Number(req.query.actorId) || undefined,
          entityType: req.query.entityType || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(100, Number(req.query.limit) || 30),
        }),
      );
    }),
  );

  return router;
};

export default createAuditAdminRouter;