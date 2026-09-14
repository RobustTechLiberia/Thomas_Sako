import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createSettingsAdminRouter = ({ contentService, settingsRepo, auditRepo }) => {
  const router = express.Router();
  router.use(requireAuth, requireRole(...PUBLIC_ROLES));
  const audit = makeAuditLogger(auditRepo);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await contentService.getSettings());
    }),
  );

  router.put(
    "/",
    asyncHandler(async (req, res) => {
      const updates = req.body || {};
      const saved = [];
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        saved.push(await contentService.updateSetting(key, value, req.user.id));
      }
      await audit(req)({
        action: "update",
        entityType: "settings",
        newValues: { keys: saved.map((s) => s.key) },
      });
      res.json({ settings: await contentService.getSettings() });
    }),
  );

  router.put(
    "/:key",
    asyncHandler(async (req, res) => {
      const setting = await contentService.updateSetting(
        req.params.key,
        req.body,
        req.user.id,
      );
      await audit(req)({
        action: "update",
        entityType: "settings",
        entityId: setting.id,
        newValues: { key: setting.key },
      });
      res.json({ setting });
    }),
  );

  return router;
};

export default createSettingsAdminRouter;