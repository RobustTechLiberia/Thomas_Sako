const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_DATABASE"];
const VOTE_WINDOW_SECONDS = 24 * 60 * 60; // 24 hours

// Attach required middleware
router.use(express.json());

/**
 * Checks if the minimal required database environment variables are set.
 */
const isDatabaseConfigured = () => {
  const hasBaseVars = REQUIRED_DB_VARS.every((varName) =>
    Boolean(process.env[varName]),
  );
  const hasPassword = Boolean(process.env.DB_PASS || process.env.DB_PASSWORD);
  return hasBaseVars && hasPassword;
};

/**
 * Safely builds SSL configuration object if certificates exist.
 */
const getSslConfig = () => {
  try {
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

      const configuredPath = path.resolve(
        process.cwd(),
        process.env.DB_SSL_CA_FILE,
      );
      if (fs.existsSync(configuredPath)) {
        return {
          ca: fs.readFileSync(configuredPath),
          rejectUnauthorized: true,
        };
      }
    }

    const defaultCaPath = path.resolve(process.cwd(), "ca.pem");
    if (fs.existsSync(defaultCaPath)) {
      return {
        ca: fs.readFileSync(defaultCaPath),
        rejectUnauthorized: true,
      };
    }
  } catch (err) {
    console.error("Failed to initialize SSL configuration:", err.message);
  }

  return undefined;
};

// Lazy connection pool initialization to prevent boot-time crash when misconfigured
let pool = null;

const getPool = () => {
  if (!pool && isDatabaseConfigured()) {
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

    pool = mysql.createPool(dbConfig).promise();
  }
  return pool;
};

/**
 * Deterministically derives a unique cookie key for a given poll question.
 */
const getVoteCookieName = (question) => {
  const hash = crypto
    .createHash("sha256")
    .update(question)
    .digest("hex")
    .slice(0, 20);

  return `poll_vote_${hash}`;
};

/**
 * Robust cookie check handling standard req.cookies or raw headers.
 */
const hasVoteCookie = (req, cookieName) => {
  if (req.cookies && req.cookies[cookieName]) {
    return true;
  }

  const rawCookies = req.headers.cookie || "";
  return rawCookies.split(";").some((item) => {
    const [key] = item.trim().split("=");
    return key === cookieName;
  });
};

// POST /submit - Record a new vote
router.post("/submit", async (req, res) => {
  const dbPool = getPool();
  if (!dbPool) {
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
        "You have already voted on this question. Please try again tomorrow.",
    });
  }

  try {
    const insertSql =
      "INSERT INTO poll (questions, answers, votes, date) VALUES (?, ?, 1, ?)";
    const voteDate = new Date().toISOString().slice(0, 10);

    const [result] = await dbPool.query(insertSql, [
      normalizedQuestion,
      normalizedAnswer,
      voteDate,
    ]);

    const isProduction = process.env.NODE_ENV === "production";
    const cookieFlags = [
      `${voteCookieName}=1`,
      `Max-Age=${VOTE_WINDOW_SECONDS}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      ...(isProduction ? ["Secure"] : []),
    ].join("; ");

    res.setHeader("Set-Cookie", cookieFlags);

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Database error during vote submission:", err);
    return res
      .status(500)
      .json({ error: "Failed to process form submission." });
  }
});

// GET /results - Fetch poll results
router.get("/results", async (req, res) => {
  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({
      error: "Analytics service is currently unavailable.",
    });
  }

  const { question } = req.query;

  if (typeof question !== "string" || !question.trim()) {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'question' query parameter." });
  }

  const normalizedQuestion = question.trim();
  const sql = `
    SELECT 
      answers, 
      COALESCE(SUM(votes), 0) AS total_votes 
    FROM poll 
    WHERE questions = ? 
    GROUP BY answers
  `;

  try {
    const [rows] = await dbPool.query(sql, [normalizedQuestion]);

    const stats = {};
    rows.forEach((row) => {
      stats[row.answers] = Number(row.total_votes) || 0;
    });

    return res.status(200).json({
      question: normalizedQuestion,
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
