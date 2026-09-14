import express from "express";
import { asyncHandler, AppError } from "../lib/errors.js";
import { identityHashes } from "../lib/voterHash.js";

// Legacy endpoints the original public frontend relied on. Kept so the old
// components (which the audit found still reference /poll, /db, /results,
// /socialmedia, /subscribe) keep working during transition.
export const createLegacyRouter = ({ pollService, subscribeService, contentService }) => {
  const router = express.Router();

  /** GET /poll — legacy active poll payload ({ question, options }). */
  router.get(
    "/poll",
    asyncHandler(async (req, res) => {
      const { ipHash, userAgentHash } = identityHashes(req);
      const poll = await pollService.currentForPublic(ipHash, userAgentHash);
      if (!poll) return res.json(null);
      res.json({
        id: poll.id,
        question: poll.question,
        options: poll.options,
        hasVoted: poll.hasVoted,
        counts: poll.counts,
        totalVotes: poll.totalVotes,
      });
    }),
  );

  /** GET /results?question=... — legacy results aggregate (defaults to active poll). */
  router.get(
    "/results",
    asyncHandler(async (req, res) => {
      const { ipHash, userAgentHash } = identityHashes(req);
      const poll = req.query.question
        ? await pollService.byQuestion(req.query.question)
        : await pollService.currentForPublic(ipHash, userAgentHash);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const results = await pollService.publicResults(poll.id);
      res.json({ question: results.question, votes: results.counts, total_votes: results.totalVotes });
    }),
  );

  /** POST /db — legacy vote endpoint ({ question, answer }). */
  router.post(
    "/db",
    asyncHandler(async (req, res) => {
      const { ipHash, userAgentHash } = identityHashes(req);
      const poll = await pollService.byQuestion(req.body?.question);
      if (!poll) throw new AppError(404, "Active poll question not found");
      const result = await pollService.castVote({
        pollId: poll.id,
        answer: req.body?.answer,
        ipHash,
        userAgentHash,
      });
      res.status(201).json({ message: "Vote recorded successfully!", ...result });
    }),
  );

  /** GET /socialmedia — legacy social links. */
  router.get(
    "/socialmedia",
    asyncHandler(async (req, res) => {
      res.json(await contentService.getSocialLinks());
    }),
  );

  return router;
};

export default createLegacyRouter;