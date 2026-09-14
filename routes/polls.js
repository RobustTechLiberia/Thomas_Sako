import express from "express";
import db from "./db.js";

const router = express.Router();

router.post("/db", async (req, res) => {
  let connection;
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required." });
    }

    const ipAddress =
      req.ip || req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
    const userAgent = req.headers["user-agent"] || "";

    connection = await poolc.getConnection();

    const [polls] = await connection.execute(
      `SELECT id, question_text, options FROM poll_questions 
       WHERE question_text = ? AND status = 'active' LIMIT 1`,
      [question],
    );

    if (polls.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Active poll question not found." });
    }

    const poll = polls[0];
    const options =
      typeof poll.options === "string"
        ? JSON.parse(poll.options)
        : poll.options;

    if (!options.includes(answer)) {
      connection.release();
      return res
        .status(400)
        .json({ error: "Invalid answer option selection." });
    }

    const [existing] = await connection.execute(
      `SELECT id FROM poll_votes 
       WHERE poll_question_id = ? 
       AND ip_address = ? 
       AND user_agent = ? 
       AND voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       LIMIT 1`,
      [poll.id, ipAddress, userAgent],
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(429).json({
        error: "You have already voted on this poll within the last 24 hours.",
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO poll_votes (poll_question_id, question_text, answer_text, ip_address, user_agent, votes, voted_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [poll.id, poll.question_text, answer, ipAddress, userAgent],
    );

    connection.release();

    return res.status(201).json({
      message: "Vote recorded successfully",
      vote_id: result.insertId,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Vote error:", error);
    return res.status(500).json({ error: "Failed to record vote" });
  }
});

router.get("/poll", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [polls] = await connection.execute(
      `SELECT id, question_text, options, published_at FROM poll_questions 
       WHERE status = 'active' LIMIT 1`,
    );
    connection.release();

    if (polls.length === 0) {
      return res.json(null);
    }

    const poll = polls[0];
    const options =
      typeof poll.options === "string"
        ? JSON.parse(poll.options)
        : poll.options;

    return res.json({
      id: poll.id,
      question: poll.question_text,
      options,
      published_at: poll.published_at,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Get active poll error:", error);
    return res.status(500).json({ error: "Failed to get poll" });
  }
});

router.get("/:id/results", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    const [questions] = await connection.execute(
      "SELECT question_text, options FROM poll_questions WHERE id = ?",
      [id],
    );

    if (questions.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Poll not found" });
    }

    const [votes] = await connection.execute(
      `SELECT answer_text, COUNT(*) as count
       FROM poll_votes
       WHERE poll_question_id = ?
       GROUP BY answer_text`,
      [id],
    );

    connection.release();

    const options =
      typeof questions[0].options === "string"
        ? JSON.parse(questions[0].options)
        : questions[0].options;

    const results = {};
    options.forEach((opt) => {
      results[opt] = 0;
    });

    votes.forEach((vote) => {
      results[vote.answer_text] = Number(vote.count);
    });

    return res.json({
      question: questions[0].question_text,
      results,
      total_votes: Object.values(results).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Get results error:", error);
    return res.status(500).json({ error: "Failed to get results" });
  }
});

export default router;
