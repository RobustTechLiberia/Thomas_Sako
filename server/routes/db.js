const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Parse incoming JSON requests for this router
router.use(express.json());

/**
 * Reads CA certificate synchronously ONCE during module init/startup.
 */
const getSslConfig = () => {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  const rawCaFile = process.env.DB_SSL_CA_FILE;

  if (rawCaFile && rawCaFile.includes("BEGIN CERTIFICATE")) {
    return {
      ca: rawCaFile.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  const configuredPath = rawCaFile
    ? path.resolve(__dirname, "..", rawCaFile)
    : null;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return {
      ca: fs.readFileSync(configuredPath),
      rejectUnauthorized: true,
    };
  }

  const rootCertPath = path.resolve(__dirname, "../../ca.pem");
  if (fs.existsSync(rootCertPath)) {
    return {
      ca: fs.readFileSync(rootCertPath),
      rejectUnauthorized: true,
    };
  }

  return undefined;
};

// Create promise-based connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: getSslConfig(),
});

/**
 * Controller to handle vote insertion
 */
const handleVoteInsertion = async (req, res, next) => {
  try {
    const { question, answer } = req.body || {};

    const cleanQuestion = typeof question === "string" ? question.trim() : "";
    const cleanAnswer = typeof answer === "string" ? answer.trim() : "";

    if (!cleanQuestion || !cleanAnswer) {
      return res.status(400).json({ error: "Question and answer are required" });
    }

    // Let MySQL handle CURDATE() natively to avoid UTC drift
    const sql = `
      INSERT INTO poll (questions, answers, votes, date)
      VALUES (?, ?, 1, CURDATE())
    `;

    const [result] = await pool.execute(sql, [cleanQuestion, cleanAnswer]);

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Failed to insert vote into MySQL:", err);
    return res.status(500).json({ error: "Failed to record vote" });
  }
};

// Routes
router.post("/", handleVoteInsertion);
router.post("/db", handleVoteInsertion);

router.get("/results", async (req, res) => {
  try {
    const rawQuestion = req.query.question;
    const cleanQuestion =
      typeof rawQuestion === "string" ? rawQuestion.trim() : "";

    if (!cleanQuestion) {
      return res.status(400).json({
        error: "Missing 'question' query parameter",
      });
    }

    const sql = `
      SELECT 
        answers,
        SUM(votes) AS total_votes
      FROM poll
      WHERE questions = ?
      GROUP BY answers
    `;

    const [rows] = await pool.execute(sql, [cleanQuestion]);

    const formattedResults = rows.map((row) => ({
      answers: row.answers,
      total_votes: Number(row.total_votes) || 0,
    }));

    return res.status(200).json({
      question: cleanQuestion,
      results: formattedResults,
    });
  } catch (err) {
    console.error("Failed to fetch aggregate poll analytics:", err);
    return res.status(500).json({
      error: "Database analytics retrieval failed",
    });
  }
});

router.get("/db", (req, res) => {
  return res.status(405).json({
    error: "Database setup is disabled. The existing poll table is used as-is.",
  });
});

module.exports = router;