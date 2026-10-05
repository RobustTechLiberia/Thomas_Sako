const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const getSslConfig = () => {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  if (process.env.DB_SSL_CA_FILE) {
    // Accept a PEM placed in the legacy *_FILE variable as well. This keeps
    // existing deployments working while DB_SSL_CA remains the preferred name.
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

  // `process.cwd()` differs between local Node, Vercel functions and other
  // hosts. Resolve the checked-in CA relative to this module instead.
  const certificatePath = path.resolve(__dirname, "../../ca.pem");

  if (fs.existsSync(certificatePath)) {
    return { ca: fs.readFileSync(certificatePath), rejectUnauthorized: true };
  }

  return undefined;
};

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

const hasVoteCookie = (req, cookieName) =>
  (req.headers.cookie || "")
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${cookieName}=`));

router.post("/submit", express.json(), async (req, res) => {
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
      message: "You have already voted on this question. Please try the next daily poll.",
    });
  }

  try {
    // Use the existing poll table and its existing columns; no schema changes are needed.
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

  const sql = `
    SELECT answers, COUNT(*) AS total_votes 
    FROM poll 
    WHERE questions = ? 
    GROUP BY answers
  `;

  try {
    const [rows] = await pool.query(sql, [question]);

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
