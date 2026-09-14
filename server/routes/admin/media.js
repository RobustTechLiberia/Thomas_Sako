import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import uploadSingleImage from "../../lib/mediaUpload.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createMediaAdminRouter = ({ mediaService, auditRepo }) => {
  const router = express.Router();
  router.use(requireAuth, requireRole(...PUBLIC_ROLES));
  const audit = makeAuditLogger(auditRepo);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(
        await mediaService.list({
          search: req.query.search || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(100, Number(req.query.limit) || 30),
        }),
      );
    }),
  );

  router.post(
    "/",
    uploadSingleImage,
    asyncHandler(async (req, res) => {
      if (!req.file) throw new AppError(400, "No file uploaded");
      const media = await mediaService.saveUploaded(req.file, req.user.id);
      await audit(req)({
        action: "create",
        entityType: "media",
        entityId: media.id,
        newValues: { url: media.url, filename: media.filename },
      });
      res.status(201).json({ media });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "Invalid media id");
      const media = await mediaService.remove(id);
      await audit(req)({
        action: "delete",
        entityType: "media",
        entityId: id,
        oldValues: media ? { url: media.url } : null,
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createMediaAdminRouter;