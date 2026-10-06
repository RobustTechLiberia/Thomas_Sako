const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const requiredDatabaseVariables = ["DB_HOST", "DB_USER", "DB_DATABASE"];

// Required parsing middleware attached at the router level
router.use(express.json());

const isDatabaseConfigured = () =>
  requiredDatabaseVariables.every((variable) =>
    Boolean(process.env[variable]),
  ) && Boolean(process.env.DB_PASS || process.env.DB_PASSWORD);

const getSslConfig = () => {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  if (process.env.DB_SSL_CA_FILE) {
    if (process.env.DB_SSL_CA_FILE.includes("BEGIN CERTIFICATE")) {
      return {
        ca: process.env.DB_SSL_CA_FILE.replace(/\\n/g, "\n"),
        rejectUnauthorized: true,
      };
    }

    const configuredCertificatePath = path.resolve(
      __dirname,
      "..",
      process.env.DB_SSL_CA_FILE,
    );
    if (fs.existsSync(configuredCertificatePath)) {
      return {
        ca: fs.readFileSync(configuredCertificatePath),
        rejectUnauthorized: true,
      };
    }
  }

  const certificatePath = path.resolve(__dirname, "../../ca.pem");

  if (fs.existsSync(certificatePath)) {
    return { ca: fs.readFileSync(certificatePath), rejectUnauthorized: true };
  }

  return undefined;
};

// Global config container parsed safely
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: getSslConfig(),
};

// Create the pool
const pool = mysql.createPool(dbConfig).promise();
const voteWindowSeconds = 24 * 60 * 60;

const getVoteCookieName = (question) => {
  const questionKey = crypto
    .createHash("sha256")
    .update(question)
    .digest("hex")
    .slice(0, 20);

  return `poll_vote_${questionKey}`;
};

const hasVoteCookie = (req, cookieName) => {
  // Safe extraction supporting standard cookier parsers or raw headers
  const rawCookies = req.headers.cookie || "";
  return rawCookies
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${cookieName}=`));
};

// Removed express.json() from route signature to prevent collision with router-level parsing
router.post("/submit", async (req, res) => {
  if (!isDatabaseConfigured()) {
    console.error("Vote database is not configured.");
    return res.status(503).json({
      error: "Voting is temporarily unavailable. Please try again later.",
    });
  }

  const { question, answer } = req.body;

  if (
    typeof question !== "string" ||
    typeof answer !== "string" ||
    !question.trim() ||
    !answer.trim()
  ) {
    return res
      .status(400)
      .json({ error: "Question and answer fields are required." });
  }

  const normalizedQuestion = question.trim();
  const normalizedAnswer = answer.trim();

  const voteCookieName = getVoteCookieName(normalizedQuestion);
  if (hasVoteCookie(req, voteCookieName)) {
    return res.status(429).json({
      error: "Submission locked.",
      message:
        "You have already voted on this question. Please try the next daily poll.",
    });
  }

  try {
    // Inserts 1 row per vote with a value of '1' in the votes column
    const insertSql =
      "INSERT INTO poll (questions, answers, votes, date) VALUES (?, ?, 1, ?)";
    const voteDate = new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(insertSql, [
      normalizedQuestion,
      normalizedAnswer,
      voteDate,
    ]);

    res.setHeader(
      "Set-Cookie",
      `${voteCookieName}=1; Max-Age=${voteWindowSeconds}; Path=/; HttpOnly; SameSite=Lax`,
    );

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  } catch (err) {
    console.error(
      "Database interaction error during submission processing:",
      err,
    );
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

  // FIXED: Summed the `votes` column instead of counting the rows. 
  // If the schema matches an upsert pattern elsewhere, SUM(votes) ensures total numerical accuracy.
  const sql = `
    SELECT answers, SUM(votes) AS total_votes 
    FROM poll 
    WHERE questions = ? 
    GROUP BY answers
  `;

  try {
    const [rows] = await pool.query(sql, [question.trim()]);

    const stats = {};
    rows.forEach((row) => {
      stats[row.answers] = parseInt(row.total_votes, 10) || 0;
    });

    return res.status(200).json({
      question: question.trim(),
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
