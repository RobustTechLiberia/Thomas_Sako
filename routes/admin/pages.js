import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";

// Editing content is open to all CMS roles; deleting content is admin-only.
export const createPageAdminRouter = ({ contentService, auditRepo }) => {
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
        await contentService.listPages({
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
      const page = await contentService.createPage(req.body, req.user.id);
      await audit(req)({
        action: "create",
        entityType: "page",
        entityId: page.id,
        newValues: { slug: page.slug, title: page.title },
      });
      res.status(201).json({ page });
    }),
  );

  router.get(
    "/:slug",
    asyncHandler(async (req, res) => {
      const page = await contentService.getAdminPage(req.params.slug);
      if (!page) throw new AppError(404, "Page not found");
      res.json({ page });
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid page id");
      const before = await contentService.getAdminPageById(id);
      const page = await contentService.updatePage(id, req.body, req.user.id);
      await audit(req)({
        action: "update",
        entityType: "page",
        entityId: id,
        oldValues: { slug: before.slug, title: before.title },
        newValues: { slug: page.slug, title: page.title },
      });
      res.json({ page });
    }),
  );

  router.delete(
    "/:id",
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid page id");
      const page = await contentService.deletePage(id, req.user.id);
      await audit(req)({
        action: "delete",
        entityType: "page",
        entityId: id,
        oldValues: { slug: page.slug },
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createPageAdminRouter;