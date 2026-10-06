const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_DATABASE"];
const VOTE_WINDOW_SECONDS = 24 * 60 * 60; // 24 hours

// Attach JSON body parsing middleware
router.use(express.json());

/**
 * Validates minimal required database environment variables.
 */
const isDatabaseConfigured = () => {
  const hasBaseVars = REQUIRED_DB_VARS.every((varName) =>
    Boolean(process.env[varName]),
  );
  const hasPassword = Boolean(process.env.DB_PASS || process.env.DB_PASSWORD);
  return hasBaseVars && hasPassword;
};

/**
 * Pre-evaluates SSL configuration ONCE at startup to prevent blocking event loop I/O.
 */
const cachedSslConfig = (() => {
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
})();

// Thread-safe / idempotent connection pool initialization
let pool = null;

const getPool = () => {
  if (pool) return pool;

  if (isDatabaseConfigured()) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || "3306", 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: cachedSslConfig,
    });
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
 * Robust cookie parser fallback for requests missing cookie-parser middleware.
 */
const hasVoteCookie = (req, cookieName) => {
  if (req.cookies && req.cookies[cookieName]) {
    return true;
  }

  const rawCookies = req.headers.cookie;
  if (!rawCookies) return false;

  return rawCookies.split(";").some((cookieStr) => {
    const parts = cookieStr.trim().split("=");
    const name = parts[0];
    return name === cookieName;
  });
};

// POST /submit - Record a poll vote
router.post("/submit", async (req, res) => {
  const dbPool = getPool();
  if (!dbPool) {
    console.error("Vote database is not configured.");
    return res.status(503).json({
      error: "Voting is temporarily unavailable. Please try again later.",
    });
  }

  const { question, answer } = req.body || {};

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
    // Delegate date resolution to MySQL CURDATE() to avoid server UTC drift
    const insertSql = `
      INSERT INTO poll (questions, answers, votes, date) 
      VALUES (?, ?, 1, CURDATE())
    `;

    const [result] = await dbPool.execute(insertSql, [
      normalizedQuestion,
      normalizedAnswer,
    ]);

    // Use Express native res.cookie to prevent header overwrites
    res.cookie(voteCookieName, "1", {
      maxAge: VOTE_WINDOW_SECONDS * 1000, // Express expects milliseconds
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

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

// GET /results - Fetch aggregate poll results
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
    const [rows] = await dbPool.execute(sql, [normalizedQuestion]);

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
