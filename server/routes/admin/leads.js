import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createLeadsAdminRouter = ({ bookingService, auditRepo }) => {
  const router = express.Router();
  router.use(requireAuth, requireRole(...PUBLIC_ROLES));
  const audit = makeAuditLogger(auditRepo);

  const asId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(
        await bookingService.list({
          source: req.query.source || undefined,
          status: req.query.status || undefined,
          search: req.query.search || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(200, Number(req.query.limit) || 20),
        }),
      );
    }),
  );

  router.get(
    "/stats",
    asyncHandler(async (req, res) => {
      res.json(await bookingService.stats());
    }),
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid lead id");
      const before = await bookingService.list({ page: 1, limit: 1000 });
      const found = before.rows.find((l) => l.id === id);
      const lead = await bookingService.setStatus(id, req.body?.status);
      await audit(req)({
        action: "set_status",
        entityType: "lead",
        entityId: id,
        oldValues: found ? { status: found.status, name: found.name } : null,
        newValues: { status: lead.status, name: lead.name },
      });
      res.json({ lead });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid lead id");
      const lead = await bookingService.remove(id);
      await audit(req)({
        action: "delete",
        entityType: "lead",
        entityId: id,
        oldValues: { name: lead.name, email: lead.email },
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createLeadsAdminRouter;