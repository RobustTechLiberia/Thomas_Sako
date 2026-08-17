/* eslint-disable no-undef */
const express = require("express");
const mysql = require("mysql2");
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

const pool = mysql.createPool(dbConfig);

router.post("/submit", express.json(), (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res
      .status(400)
      .json({ error: "Question and answer fields are required." });
  }

  const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
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

  pool.query(checkSql, [question, userHash], (err, rows) => {
    if (err) {
      console.error("Server validation rate-limit error:", err);
      return res.status(500).json({ error: "Internal validation failure." });
    }

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

    pool.query(insertSql, [question, answer, userHash], (err, result) => {
      if (err) {
        console.error("Failed to insert vote into MySQL:", err);
        return res
          .status(500)
          .json({ error: "Failed to process form submission." });
      }

      return res.status(201).json({
        message: "Vote recorded successfully!",
        id: result.insertId,
      });
    });
  });
});

router.get("/results", (req, res) => {
  const { question } = req.query;

  if (!question) {
    return res
      .status(400)
      .json({ error: "Missing 'question' query parameter." });
  }

  const sql = `
    SELECT answers, SUM(votes) AS total_votes 
    FROM poll 
    WHERE questions = ? 
    GROUP BY answers
  `;

  pool.query(sql, [question], (err, rows) => {
    if (err) {
      console.error("Failed to fetch aggregate poll analytics:", err);
      return res
        .status(500)
        .json({ error: "Database analytics retrieval failed." });
    }

    const stats = {};
    rows.forEach((row) => {
      stats[row.answers] = parseInt(row.total_votes, 10) || 0;
    });

    return res.status(200).json({
      question: question,
      votes: stats,
    });
  });
});

module.exports = router;
