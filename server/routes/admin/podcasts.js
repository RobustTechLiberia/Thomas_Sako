import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

export const createPodcastAdminRouter = ({ podcastService, auditRepo }) => {
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
        await podcastService.list({
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
      const podcast = await podcastService.create(req.body, req.user.id);
      await audit(req)({
        action: "create",
        entityType: "podcast",
        entityId: podcast.id,
        newValues: { title: podcast.title, status: podcast.status },
      });
      res.status(201).json({ podcast });
    }),
  );

  router.post(
    "/:id/publish",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid podcast id");
      const podcast = await podcastService.setStatus(id, "published");
      await audit(req)({
        action: "publish",
        entityType: "podcast",
        entityId: id,
        newValues: { status: "published" },
      });
      res.json({ podcast });
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid podcast id");
      const podcast = await podcastService.update(id, req.body, req.user.id);
      await audit(req)({
        action: "update",
        entityType: "podcast",
        entityId: id,
        newValues: { title: podcast.title, status: podcast.status },
      });
      res.json({ podcast });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid podcast id");
      const podcast = await podcastService.remove(id);
      await audit(req)({
        action: "delete",
        entityType: "podcast",
        entityId: id,
        oldValues: { title: podcast.title },
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createPodcastAdminRouter;