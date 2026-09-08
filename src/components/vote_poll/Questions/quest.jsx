/* eslint-disable no-undef */
const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password@123",
  database: "db_poll",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Use promise-based pool for clean async/await execution
const pool = mysql.createPool(dbConfig);

const getSanitizedIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  let rawIp = forwarded
    ? forwarded.split(",")[0].trim()
    : req.socket.remoteAddress || "";

  if (rawIp.startsWith("::ffff:")) {
    rawIp = rawIp.replace("::ffff:", "");
  }

  return rawIp.replace(/[^a-fA-F0-9:.]/g, "");
};

router.post("/db", express.json(), async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res
      .status(400)
      .json({ error: "Question and answer fields are required." });
  }

  // Sanitize IP address formatting (handling potential multi-proxy comma strings)
  const userIp = getSanitizedIp(req);
  const userAgent = req.headers["user-agent"] || "";

  const userHash = crypto
    .createHash("sha256")
    .update(`${userIp}-${userAgent}`)
    .digest("hex");

  const checkSql = `
    SELECT created_at FROM poll 
    WHERE questions = ? AND user_hash = ? AND created_at > NOW() - INTERVAL 1 DAY 
    LIMIT 1
  `;

  try {
    const [rows] = await pool.execute(checkSql, [question, userHash]);

    if (rows.length > 0) {
      const timeVoted = new Date(rows[0].created_at);
      const timeAllowed = new Date(timeVoted.getTime() + 24 * 60 * 60 * 1000);

      return res.status(429).json({
        error: "Submission locked.",
        message: `You have already voted on this question. You can vote again at: ${timeAllowed.toLocaleString()}`,
      });
    }

    const insertSql =
      "INSERT INTO poll (questions, answers, user_hash) VALUES (?, ?, ?)";

    const [result] = await pool.execute(insertSql, [
      question,
      answer,
      userHash,
    ]);

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Database operation failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to process form submission." });
  }
});

router.get("/results", async (req, res) => {
  const { question } = req.query;

  if (!question) {
    return res
      .status(400)
      .json({ error: "Missing 'question' query parameter." });
  }

  // Changed SUM(votes) to COUNT(*) to properly tally row entries per answer
  const sql = `
    SELECT answers, COUNT(*) AS total_votes 
    FROM poll 
    WHERE questions = ? 
    GROUP BY answers
  `;

  try {
    const [rows] = await pool.execute(sql, [question]);

    const stats = {};
    rows.forEach((row) => {
      stats[row.answers] = parseInt(row.total_votes, 10) || 0;
    });

    return res.status(200).json({
      question: question,
      votes: stats,
    });
  } catch (err) {
    console.error("Failed to fetch aggregate poll analytics:", err);
    return res
      .status(500)
      .json({ error: "Database analytics retrieval failed." });
  }
});

module.exports = router;
