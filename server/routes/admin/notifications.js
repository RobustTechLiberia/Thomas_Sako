import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createNotificationAdminRouter = ({ notifyService, auditRepo }) => {
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
        await notifyService.list({
          status: req.query.status || undefined,
          contentType: req.query.contentType || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(100, Number(req.query.limit) || 20),
        }),
      );
    }),
  );

  router.get(
    "/stats",
    asyncHandler(async (req, res) => {
      res.json(await notifyService.stats());
    }),
  );

  router.get(
    "/:id/recipients",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid notification id");
      res.json(
        await notifyService.listRecipients({
          notificationId: id,
          status: req.query.status || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(200, Number(req.query.limit) || 50),
        }),
      );
    }),
  );

  router.post(
    "/retry-failed",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const result = await notifyService.retryFailed();
      await audit(req)({
        action: "retry_failed",
        entityType: "notification",
        newValues: result,
      });
      res.json(result);
    }),
  );

  return router;
};

export default createNotificationAdminRouter;