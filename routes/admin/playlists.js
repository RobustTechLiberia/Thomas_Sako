import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createPlaylistAdminRouter = ({ playlistService, auditRepo }) => {
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
        await playlistService.list({
          search: req.query.search || undefined,
          status: req.query.status || undefined,
          page: Math.max(1, Number(req.query.page) || 1),
          limit: Math.min(100, Number(req.query.limit) || 20),
        }),
      );
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const playlist = await playlistService.create(req.body, req.user.id);
      await audit(req)({
        action: "create",
        entityType: "playlist",
        entityId: playlist.id,
        newValues: { title: playlist.title, status: playlist.status },
      });
      res.status(201).json({ playlist });
    }),
  );

  router.post(
    "/:id/publish",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid playlist id");
      const playlist = await playlistService.setStatus(id, "published");
      await audit(req)({
        action: "publish",
        entityType: "playlist",
        entityId: id,
        newValues: { status: "published" },
      });
      res.json({ playlist });
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid playlist id");
      const playlist = await playlistService.update(id, req.body, req.user.id);
      await audit(req)({
        action: "update",
        entityType: "playlist",
        entityId: id,
        newValues: { title: playlist.title, status: playlist.status },
      });
      res.json({ playlist });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid playlist id");
      const playlist = await playlistService.remove(id);
      await audit(req)({
        action: "delete",
        entityType: "playlist",
        entityId: id,
        oldValues: { title: playlist.title },
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createPlaylistAdminRouter;