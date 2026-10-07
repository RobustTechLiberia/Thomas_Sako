"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const router = express.Router();
router.use(express.json());

const REQUIRED_DB_VARS = ["DB_HOST", "DB_USER", "DB_DATABASE"];
const VOTE_WINDOW_SECONDS = 24 * 60 * 60;

const isDatabaseConfigured = () => {
  const hasBaseVars = REQUIRED_DB_VARS.every((varName) =>
    Boolean(process.env[varName]),
  );
  const hasPassword = Boolean(process.env.DB_PASS || process.env.DB_PASSWORD);
  return hasBaseVars && hasPassword;
};

const normalizePem = (value) => {
  if (!value) return "";
  return String(value)
    .replace(\(/\r\\\)n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(\(/\r\\)n/g, "\n")
    .trim();
};

const loadSslConfig = () => {
  try {
    if (process.env.DB_SSL_CA) {
      const ca = normalizePem(process.env.DB_SSL_CA);
      if (!ca.includes("BEGIN CERTIFICATE")) {
        throw new Error("DB_SSL_CA does not contain a valid PEM certificate.");
      }
      return { ca, rejectUnauthorized: true };
    }

    if (process.env.DB_SSL_CA_FILE) {
      const configuredValue = process.env.DB_SSL_CA_FILE.trim();
      if (configuredValue.includes("-----BEGIN CERTIFICATE-----")) {
        return {
          ca: normalizePem(configuredValue),
          rejectUnauthorized: true,
        };
      }

      const possiblePaths = [
        path.resolve(process.cwd(), configuredValue),
        path.resolve(__dirname, configuredValue),
        path.resolve(process.cwd(), "..", configuredValue),
      ];

      for (const certificatePath of possiblePaths) {
        if (fs.existsSync(certificatePath)) {
          const ca = normalizePem(fs.readFileSync(certificatePath, "utf8"));
          if (ca.includes("-----BEGIN CERTIFICATE-----")) {
            return { ca, rejectUnauthorized: true };
          }
        }
      }
      throw new Error(`CA certificate file was not found: ${configuredValue}`);
    }

    const defaultPaths = [
      path.resolve(process.cwd(), "ca.pem"),
      path.resolve(__dirname, "ca.pem"),
      path.resolve(__dirname, "..", "ca.pem"),
    ];

    for (const certificatePath of defaultPaths) {
      if (fs.existsSync(certificatePath)) {
        const ca = normalizePem(fs.readFileSync(certificatePath, "utf8"));
        if (ca.includes("-----BEGIN CERTIFICATE-----")) {
          return { ca, rejectUnauthorized: true };
        }
      }
    }

    const sslMode = String(process.env.SSL_MODE || "").toUpperCase();
    if (sslMode === "REQUIRED" || sslMode === "VERIFY_CA") {
      throw new Error(
        `SSL_MODE=${sslMode} but no valid Aiven CA certificate was found.`,
      );
    }

    return undefined;
  } catch (error) {
    console.error("Failed to initialize SSL configuration:", error.message);
    throw error;
  }
};

let pool = null;

const getPool = () => {
  if (pool) return pool;
  if (!isDatabaseConfigured()) return null;

  const port = Number.parseInt(process.env.DB_PORT || "3306", 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid DB_PORT: ${process.env.DB_PORT}`);
  }

  const ssl = loadSslConfig();

  pool = mysql.createPool({
    host: process.env.DB_HOST.trim(),
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE.trim(),
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl,
  });

  return pool;
};

const getVoteCookieName = (question) => {
  const hash = crypto
    .createHash("sha256")
    .update(question)
    .digest("hex")
    .slice(0, 20);
  return `poll_vote_${hash}`;
};

const hasVoteCookie = (req, cookieName) => {
  if (req.cookies && Object.prototype.hasOwnProperty.call(req.cookies, cookieName)) {
    return true;
  }
  const rawCookies = req.headers.cookie;
  if (!rawCookies) return false;
  return rawCookies.split(";").some((cookieStr) => {
    const parts = cookieStr.trim().split("=");
    return parts[0] === cookieName;
  });
};

router.post("/submit", async (req, res) => {
  let dbPool;
  try {
    dbPool = getPool();
  } catch (error) {
    console.error("Database initialization error:", error.message);
    return res.status(503).json({ error: "Voting service is temporarily unavailable." });
  }

  if (!dbPool) {
    console.error("Vote database is not configured.");
    return res.status(503).json({ error: "Voting is temporarily unavailable. Please try again later." });
  }

  const { question, answer } = req.body || {};
  if (typeof question !== "string" || typeof answer !== "string" || !question.trim() || !answer.trim()) {
    return res.status(400).json({ error: "Question and answer fields are required." });
  }

  const normalizedQuestion = question.trim();
  const normalizedAnswer = answer.trim();

  if (normalizedQuestion.length > 255 || normalizedAnswer.length > 255) {
    return res.status(400).json({ error: "Question and answer must not exceed 255 characters." });
  }

  const voteCookieName = getVoteVoteCookieName(normalizedQuestion);
  if (hasVoteCookie(req, voteCookieName)) {
    return res.status(429).json({
      error: "Submission locked.",
      message: "You have already voted on this question. Please try again tomorrow.",
    });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();

    const [recentVotes] = await connection.execute(
      `SELECT id FROM poll WHERE questions = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) LIMIT 1`,
      [normalizedQuestion],
    );

    if (recentVotes.length > 0) {
      await connection.rollback();
      return res.status(429).json({
        error: "Submission locked.",
        message: "This question has already been answered within the last 24 hours.",
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO poll (questions, answers, votes, date) VALUES (?, ?, 1, CURDATE())`,
      [normalizedQuestion, normalizedAnswer],
    );

    await connection.commit();

    if (typeof res.cookie === "function") {
      res.cookie(voteCookieName, "1", {
        maxAge: VOTE_WINDOW_SECONDS * 1000,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (rErr) { console.error("Rollback failed:", rErr.message); }
    }
    console.error("Database error during vote submission:", error.message);
    return res.status(500).json({ error: "Failed to process form submission.", code: error.code || "DATABASE_ERROR" });
  } finally {
    if (connection) connection.release();
  }
});

router.get("/results", async (req, res) => {
  let dbPool;
  try {
    dbPool = getPool();
  } catch (error) {
    console.error("Database initialization error:", error.message);
    return res.status(503).json({ error: "Analytics service is currently unavailable." });
  }

  if (!dbPool) {
    return res.status(503).json({ error: "Analytics service is currently unavailable." });
  }

  const { question } = req.query;
  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Question query parameter is required." });
  }

  let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(
      `SELECT answers, SUM(votes) as total_votes FROM poll WHERE questions = ? GROUP BY answers`,
      [question.trim()],
    );
    return res.status(200).json({ question: question.trim(), results: rows });
  } catch (error) {
    console.error("Database error fetching results:", error.message);
    return res.status(500).json({ error: "Failed to fetch poll results." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
