import express from "express";
import { asyncHandler, AppError } from "../../lib/errors.js";
import { requireAuth, requireRole, PUBLIC_ROLES } from "../../lib/auth.js";
import { validatePollPayload } from "../../lib/validate.js";
import { makeAuditLogger } from "../../lib/auditHelper.js";
import { env } from "../../config/env.js";

export const createPollAdminRouter = ({ pollService, auditRepo, notifyService }) => {
  const router = express.Router();
  router.use(requireAuth, requireRole(...PUBLIC_ROLES));
  const audit = makeAuditLogger(auditRepo);

  const asId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  // Note: ranking by created_at desc already picks the current active poll.
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await pollService.list({
        status: req.query.status || undefined,
        search: req.query.search || undefined,
        page: Math.max(1, Number(req.query.page) || 1),
        limit: Math.min(100, Number(req.query.limit) || 10),
      });
      res.json(result);
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const poll = await pollService.create(req.body, req.user.id);
      await audit(req)({
        action: "create",
        entityType: "poll",
        entityId: poll.id,
        newValues: { question: poll.question, status: poll.status },
      });
      res.status(201).json({ poll });
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const poll = await pollService.get(id);
      if (!poll) throw new AppError(404, "Poll not found");
      res.json({ poll });
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const before = await pollService.get(id);
      if (!before) throw new AppError(404, "Poll not found");
      const poll = await pollService.update(id, req.body, req.user.id);
      await audit(req)({
        action: "update",
        entityType: "poll",
        entityId: id,
        oldValues: { question: before.question, status: before.status },
        newValues: { question: poll.question, status: poll.status },
      });
      res.json({ poll });
    }),
  );

  router.post(
    "/:id/activate",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const poll = await pollService.activate(id, req.user.id);
      await audit(req)({
        action: "activate",
        entityType: "poll",
        entityId: id,
        newValues: { status: "active" },
      });
      res.json({ poll });
    }),
  );

  router.post(
    "/:id/archive",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const poll = await pollService.archive(id, req.user.id);
      await audit(req)({
        action: "archive",
        entityType: "poll",
        entityId: id,
        newValues: { status: "archived" },
      });
      res.json({ poll });
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = asId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const before = await pollService.get(id);
      if (!before) throw new AppError(404, "Poll not found");
      await pollService.remove(id, req.user.id);
      await audit(req)({
        action: "delete",
        entityType: "poll",
        entityId: id,
        oldValues: { question: before.question },
      });
      res.status(204).end();
    }),
  );

  return router;
};

export default createPollAdminRouter;