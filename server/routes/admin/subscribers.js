import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createSubscriberAdminRouter = ({ subscribeService, auditRepo }) => {
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
        await subscribeService.list({
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
      res.json(await subscribeService.stats());
    }),
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid subscriber id");
      const before = await subscribeService.list({ search: "", page: 1, limit: 1 });
      // Fetch the single subscriber to audit identity.
      const found = (await subscribeService.list({ page: 1, limit: 1000 })).rows.find(
        (s) => s.id === id,
      );
      const subscriber = await subscribeService.setStatus(id, req.body?.status);
      await audit(req)({
        action: "set_status",
        entityType: "subscriber",
        entityId: id,
        oldValues: found ? { status: found.status, email: found.email } : null,
        newValues: { status: subscriber.status, email: subscriber.email },
      });
      void before;
      res.json({ subscriber });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid subscriber id");
      const found = (await subscribeService.list({ page: 1, limit: 1000 })).rows.find(
        (s) => s.id === id,
      );
      await subscribeService.remove(id);
      await audit(req)({
        action: "delete",
        entityType: "subscriber",
        entityId: id,
        oldValues: found ? { email: found.email } : null,
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createSubscriberAdminRouter;