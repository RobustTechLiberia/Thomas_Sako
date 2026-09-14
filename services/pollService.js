import { AppError } from "../lib/errors.js";
import { validatePollPayload } from "../lib/validate.js";
import { DuplicateVoteError } from "../repos/pollRepo.js";

const PUBLIC_STATUS = "active";
const VALID_STATUSES = ["draft", "active", "archived"];

export const createPollService = ({ pollRepo, hub, notifyService }) => {
  const isLive = (poll) => {
    if (poll.status !== PUBLIC_STATUS) return false;
    // No close time in the schema; live until archived/unpublished.
    return true;
  };

  /** Fires a "new poll" notification when this poll first becomes active. */
  const notifyIfActivating = (poll) => {
    if (poll?.status !== PUBLIC_STATUS || !notifyService) return;
    notifyService.sendUpdate({
      type: "poll",
      contentId: poll.id,
      title: poll.question,
      description: "A new poll is open on 1847 Liberty — cast your vote now.",
      url: `/api/polls/${poll.id}/results`,
    }).catch(() => {});
  };

  const normalizeResults = (poll, results) => {
    const counts = {};
    let total = 0;
    for (const option of poll.options) {
      counts[option] = results.counts[option] || 0;
      total += counts[option];
    }
    return { counts, totalVotes: total };
  };

  return {
    async list(params) {
      return pollRepo.list(params);
    },

    async get(id) {
      return pollRepo.getById(id);
    },

    async create(data, actorId) {
      const { question, options } = validatePollPayload(data);
      const status = VALID_STATUSES.includes(data.status) ? data.status : "draft";
      const publishedAt = status === PUBLIC_STATUS ? new Date() : null;
      const poll = await pollRepo.create({
        question,
        options,
        status,
        createdBy: actorId,
        publishedAt,
      });

      // Publishing a poll deactivates any other active poll (one live poll).
      if (status === PUBLIC_STATUS) {
        await this.deactivateOthers(poll.id);
        notifyIfActivating(poll);
      }
      return poll;
    },

    async update(id, data, actorId) {
      const existing = await pollRepo.getById(id);
      if (!existing) throw new AppError(404, "Poll not found");

      const fields = {};
      if (data.question !== undefined || data.options !== undefined) {
        const validated = validatePollPayload({
          question: data.question ?? existing.question,
          options: data.options ?? existing.options,
        });
        fields.question_text = validated.question;
        if (data.options !== undefined) fields.options = validated.options;
      }
      if (data.status !== undefined) {
        if (!VALID_STATUSES.includes(data.status)) {
          throw new AppError(400, "Invalid poll status");
        }
        fields.status = data.status;
        if (data.status === PUBLIC_STATUS) {
          const wasLive = existing.status === PUBLIC_STATUS;
          if (!wasLive) fields.published_at = new Date();
          await this.deactivateOthers(existing.id);
        }
      }
      const updated = await pollRepo.update(id, fields);
      if (updated.status === PUBLIC_STATUS && existing.status !== PUBLIC_STATUS) {
        notifyIfActivating(updated);
      }
      await this.syncRealtime(updated);
      return updated;
    },

    /** Activates a poll from the CMS and deactivates all others. */
    async activate(id, actorId) {
      const existing = await pollRepo.getById(id);
      if (!existing) throw new AppError(404, "Poll not found");
      await this.deactivateOthers(existing.id);
      const updated = await pollRepo.setStatus(id, PUBLIC_STATUS, {
        publishedAt: existing.publishedAt || new Date(),
      });
      notifyIfActivating(updated);
      await this.syncRealtime(updated);
      return updated;
    },

    async archive(id, actorId) {
      const existing = await pollRepo.getById(id);
      if (!existing) throw new AppError(404, "Poll not found");
      const updated = await pollRepo.setStatus(id, "archived");
      return updated;
    },

    /** Sets all other polls to draft so exactly one is active at a time. */
    async deactivateOthers(exceptId) {
      const { rows } = await pollRepo.list({ status: PUBLIC_STATUS, limit: 100 });
      for (const poll of rows) {
        if (poll.id !== exceptId) {
          await pollRepo.setStatus(poll.id, "draft");
        }
      }
    },

    async remove(id, actorId) {
      const existing = await pollRepo.getById(id);
      if (!existing) throw new AppError(404, "Poll not found");
      await pollRepo.remove(id);
    },

    /** Public: current live poll with results + whether this visitor voted. */
    async currentForPublic(ipHash, userAgentHash) {
      const poll = await pollRepo.getCurrent();
      if (!poll || !isLive(poll)) return null;

      const [results, hasVoted] = await Promise.all([
        pollRepo.results(poll.id),
        pollRepo.hasVoted(poll.id, ipHash, userAgentHash),
      ]);

      return {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        status: poll.status,
        hasVoted,
        ...normalizeResults(poll, results),
      };
    },

    /** Public: results for a specific poll id. */
    async publicResults(id) {
      const poll = await pollRepo.getById(id);
      if (!poll) throw new AppError(404, "Poll not found");
      const results = await pollRepo.results(poll.id);
      return {
        id: poll.id,
        question: poll.question,
        status: poll.status,
        ...normalizeResults(poll, results),
      };
    },

    /** Legacy: find a live poll by its question text. */
    async byQuestion(question) {
      const poll = await pollRepo.findActiveByQuestion(question);
      if (poll) return poll;
      const current = await pollRepo.getCurrent();
      return current && current.question === question ? current : null;
    },

    /**
     * Public: casts a vote. All validation is server-side; the client only
     * supplies poll id + answer text. Duplicate votes (same IP+UA) are
     * rejected atomically and results broadcast via SSE.
     */
    async castVote({ pollId, answer, ipHash, userAgentHash }) {
      const poll = await pollRepo.getById(pollId);
      if (!poll) throw new AppError(404, "Poll not found");
      if (!isLive(poll)) {
        throw new AppError(409, "This poll is no longer accepting votes");
      }

      const answerText =
        typeof answer === "string" ? answer.trim() : "";
      if (!poll.options.some((opt) => opt === answerText)) {
        throw new AppError(400, "Invalid answer option");
      }

      let voteId;
      try {
        voteId = await pollRepo.addVote({
          pollId: poll.id,
          answerText,
          ipHash,
          userAgentHash,
        });
      } catch (err) {
        if (err instanceof DuplicateVoteError) {
          throw new AppError(409, "You have already voted in this poll");
        }
        throw err;
      }

      const results = await pollRepo.results(poll.id);
      const payload = {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        ...normalizeResults(poll, results),
      };
      hub.broadcast(poll.id, payload);

      return { voteId, ...payload };
    },

    async syncRealtime(poll) {
      if (!poll) return;
      const results = await pollRepo.results(poll.id);
      hub.broadcast(poll.id, {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        ...normalizeResults(poll, results),
      });
    },
  };
};

export default createPollService;
