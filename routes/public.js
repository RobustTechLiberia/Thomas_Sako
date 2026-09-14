import express from "express";
import { asyncHandler, AppError } from "../lib/errors.js";
import { identityHashes } from "../lib/voterHash.js";
import { rateLimit } from "../lib/rateLimit.js";

const parseId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const createPublicRouter = ({
  pollService,
  subscribeService,
  contentService,
  bookingService,
  podcastService,
  playlistService,
  youtubeService,
  hub,
}) => {
  const router = express.Router();

  // ---- Polls ----
  router.get(
    "/polls/current",
    asyncHandler(async (req, res) => {
      const { ipHash, userAgentHash } = identityHashes(req);
      const poll = await pollService.currentForPublic(ipHash, userAgentHash);
      res.json({ poll });
    }),
  );

  router.get(
    "/polls/:id/results",
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      res.json(await pollService.publicResults(id));
    }),
  );

  router.post(
    "/polls/:id/vote",
    rateLimit({ max: 20, windowMs: 60 * 1000, message: "Too many requests" }),
    asyncHandler(async (req, res) => {
      const id = parseId(req.params.id);
      if (!id) throw new AppError(400, "Invalid poll id");
      const { ipHash, userAgentHash } = identityHashes(req);
      const result = await pollService.castVote({
        pollId: id,
        answer: req.body?.answer,
        ipHash,
        userAgentHash,
      });
      res.status(201).json(result);
    }),
  );

  // Server-Sent Events stream for a poll's realtime results.
  router.get("/polls/stream", (req, res) => {
    const id = parseId(req.query.poll || req.query.id);
    if (!id) {
      return res.status(400).json({ error: "Missing poll id" });
    }
    // Send any cached snapshot immediately via the hub.
    hub.subscribe(res, id);
  });

  // ---- Subscribe ----
  router.post(
    "/subscribe",
    rateLimit({ max: 10, windowMs: 60 * 1000, message: "Too many subscription attempts" }),
    asyncHandler(async (req, res) => {
      const result = await subscribeService.subscribe(req.body?.email);
      res.status(result.message === "subscribed" ? 201 : 200).json({
        message: result.message,
        emailSent: result.emailSent,
        unsubscribeUrl: result.unsubscribeUrl || null,
      });
    }),
  );

  router.get(
    "/subscribe/unsubscribe",
    asyncHandler(async (req, res) => {
      const result = await subscribeService.unsubscribeByToken(req.query.token);
      res.json(result);
    }),
  );

  // ---- Content ----
  router.get(
    "/content/settings",
    asyncHandler(async (req, res) => {
      res.json(await contentService.getPublicSettings());
    }),
  );

  router.get(
    "/content/:slug",
    asyncHandler(async (req, res) => {
      const page = await contentService.getPublicPage(req.params.slug);
      if (!page) throw new AppError(404, "Page not found");
      res.json({ page });
    }),
  );

  router.get(
    "/social",
    asyncHandler(async (req, res) => {
      res.json(await contentService.getSocialLinks());
    }),
  );

  // ---- Backward-compatible alias for the legacy frontend ----
  router.get(
    "/socialmedia",
    asyncHandler(async (req, res) => {
      res.json(await contentService.getSocialLinks());
    }),
  );

  // ---- Podcasts & playlists (CMS-managed) ----
  router.get(
    "/podcasts",
    asyncHandler(async (req, res) => {
      res.json(await podcastService.listPublic());
    }),
  );

  router.get(
    "/playlists",
    asyncHandler(async (req, res) => {
      res.json(await playlistService.listPublic());
    }),
  );

  // Latest uploads pulled from YouTube (empty array when not configured).
  router.get(
    "/youtube/latest",
    asyncHandler(async (req, res) => {
      const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
      res.json({ items: await youtubeService.latest(limit) });
    }),
  );

  // ---- Bookings ----
  router.post(
    "/bookings",
    rateLimit({ max: 10, windowMs: 60 * 60 * 1000, message: "Too many booking requests, try again later." }),
    asyncHandler(async (req, res) => {
      const result = await bookingService.submit(req.body);
      res.status(201).json({
        message: "booking_received",
        confirmationSent: result.confirmationSent,
        booked: result.lead,
      });
    }),
  );

  return router;
};

export default createPublicRouter;
