/**
 * Duplicate-vote error thrown when the atomic unique-key insert fails.
 */
export class DuplicateVoteError extends Error {
  constructor() {
    super("Duplicate vote");
    this.name = "DuplicateVoteError";
  }
}

const mapPoll = (row) => ({
  id: row.id,
  question: row.question_text,
  options: typeof row.options === "string" ? JSON.parse(row.options) : row.options,
  status: row.status,
  createdBy: row.created_by,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createPollRepo = (db) => {
  return {
    async list({ status, search, page = 1, limit = 10 } = {}) {
      const where = [];
      const params = [];
      if (status) {
        where.push("status = ?");
        params.push(status);
      }
      if (search) {
        where.push("question_text LIKE ?");
        params.push(`%${search}%`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const offset = (page - 1) * limit;

      const [rows] = await db.query(
        `SELECT * FROM poll_questions ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM poll_questions ${whereSql}`,
        params,
      );
      return {
        rows: rows.map(mapPoll),
        total: Number(countRows[0]?.total || 0),
      };
    },

    async getById(id) {
      const [rows] = await db.query(
        "SELECT * FROM poll_questions WHERE id = ? LIMIT 1",
        [id],
      );
      return rows.length ? mapPoll(rows[0]) : null;
    },

    /** Returns the single current (active) poll on the site. */
    async getCurrent() {
      const [rows] = await db.query(
        "SELECT * FROM poll_questions WHERE status = 'active' ORDER BY published_at DESC, id DESC LIMIT 1",
      );
      return rows.length ? mapPoll(rows[0]) : null;
    },

    async findActiveByQuestion(question) {
      const [rows] = await db.query(
        "SELECT * FROM poll_questions WHERE status = 'active' AND question_text = ? LIMIT 1",
        [question],
      );
      return rows.length ? mapPoll(rows[0]) : null;
    },

    async create({ question, options, status = "draft", createdBy = null, publishedAt = null }) {
      const [result] = await db.query(
        `INSERT INTO poll_questions (question_text, options, status, created_by, published_at)
         VALUES (?, ?, ?, ?, ?)`,
        [question, JSON.stringify(options), status, createdBy, publishedAt],
      );
      return this.getById(result.insertId);
    },

    async update(id, fields) {
      const map = {
        question_text: "question_text",
        options: "options",
        status: "status",
        published_at: "published_at",
      };
      const entries = Object.entries(fields).filter(
        ([key]) => key in map && fields[key] !== undefined,
      );
      if (!entries.length) return this.getById(id);
      const sets = entries.map(([key]) => `${map[key]} = ?`);
      const params = entries.map(([key, value]) =>
        key === "options" ? JSON.stringify(value) : value,
      );
      await db.query(
        `UPDATE poll_questions SET ${sets.join(", ")} WHERE id = ?`,
        [...params, id],
      );
      return this.getById(id);
    },

    async setStatus(id, status, extra = {}) {
      const sets = ["status = ?"];
      const params = [status];
      if (extra.publishedAt !== undefined) {
        sets.push("published_at = ?");
        params.push(extra.publishedAt);
      }
      await db.query(
        `UPDATE poll_questions SET ${sets.join(", ")} WHERE id = ?`,
        [...params, id],
      );
      return this.getById(id);
    },

    async remove(id) {
      await db.query("DELETE FROM poll_questions WHERE id = ?", [id]);
    },

    /**
     * Atomically records a vote. The pre-check plus the unique index on
     * (poll_question_id, ip_hash, user_agent_hash) guarantee a visitor only
     * ever counts once per poll even under concurrency. Throws
     * DuplicateVoteError on conflict.
     */
    async addVote({ pollId, answerText, ipHash, userAgentHash }) {
      const [existing] = await db.query(
        `SELECT id FROM poll_votes
         WHERE poll_question_id = ? AND ip_hash = ? AND user_agent_hash = ?
         LIMIT 1`,
        [pollId, ipHash, userAgentHash],
      );
      if (existing.length > 0) throw new DuplicateVoteError();

      try {
        const [result] = await db.query(
          `INSERT INTO poll_votes
             (poll_question_id, question_text, answer_text, ip_hash, user_agent_hash, votes)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [pollId, null, answerText, ipHash, userAgentHash],
        );
        return result.insertId;
      } catch (err) {
        if (err && (err.code === "ER_DUP_ENTRY" || err.message?.includes("Duplicate"))) {
          throw new DuplicateVoteError();
        }
        throw err;
      }
    },

    async hasVoted(pollId, ipHash, userAgentHash) {
      const [rows] = await db.query(
        "SELECT id FROM poll_votes WHERE poll_question_id = ? AND ip_hash = ? AND user_agent_hash = ? LIMIT 1",
        [pollId, ipHash, userAgentHash],
      );
      return rows.length > 0;
    },

    async results(pollId) {
      const [votes] = await db.query(
        `SELECT answer_text, COUNT(*) AS count
         FROM poll_votes
         WHERE poll_question_id = ?
         GROUP BY answer_text`,
        [pollId],
      );
      const counts = {};
      let total = 0;
      for (const vote of votes) {
        counts[vote.answer_text] = Number(vote.count);
        total += Number(vote.count);
      }
      return { counts, totalVotes: total };
    },

    async count() {
      const [rows] = await db.query("SELECT COUNT(*) AS total FROM poll_questions");
      return Number(rows[0]?.total || 0);
    },
  };
};

export default createPollRepo;
