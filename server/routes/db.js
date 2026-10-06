const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Parse incoming JSON requests for this router
router.use(express.json());

/**
 * Reads CA certificate synchronously ONCE during module init/startup.
 * Returns undefined if no CA certificate is found or provided.
 */
const getSslConfig = () => {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  const rawCaFile = process.env.DB_SSL_CA_FILE;

  if (rawCaFile && rawCaFile.includes("BEGIN CERTIFICATE")) {
    return {
      ca: rawCaFile.replace(/\\n/g, "\n"),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  const configuredPath = rawCaFile
    ? path.resolve(__dirname, "..", rawCaFile)
    : null;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return {
      ca: fs.readFileSync(configuredPath),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  const rootCertPath = path.resolve(__dirname, "../../ca.pem");
  if (fs.existsSync(rootCertPath)) {
    return {
      ca: fs.readFileSync(rootCertPath),
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  return undefined;
};

// Create promise-based connection pool with robust fallbacks
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10s timeout
};

if (process.env.DB_PORT) {
  poolConfig.port = parseInt(process.env.DB_PORT, 10);
}

const sslConfig = getSslConfig();
if (sslConfig) {
  poolConfig.ssl = sslConfig;
}

const pool = mysql.createPool(poolConfig);

/**
 * Controller to handle vote insertion
 */
const handleVoteInsertion = async (req, res) => {
  try {
    const { question, answer } = req.body || {};

    const cleanQuestion = typeof question === "string" ? question.trim() : "";
    const cleanAnswer = typeof answer === "string" ? answer.trim() : "";

    if (!cleanQuestion || !cleanAnswer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required" });
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
    return res.status(500).json({
      error: "Failed to record vote",
      details: err.message,
    });
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
      details: err.message,
    });
  }
});

/**
 * GET /db - Health Check & Diagnostics
 * Returns exact error code, message, and host config if the connection fails.
 */
router.get("/db", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();

    return res.status(200).json({
      status: "ok",
      message: "Database connection verified and poll table is active.",
      config: {
        host: poolConfig.host,
        port: poolConfig.port || 3306,
        database: poolConfig.database,
        user: poolConfig.user,
        sslEnabled: !!poolConfig.ssl,
      },
    });
  } catch (err) {
    console.error("Database health check failed:", err);
    return res.status(500).json({
      status: "error",
      error: "Database connectivity check failed",
      message: err.message,
      code: err.code || "UNKNOWN_ERROR",
      errno: err.errno,
      syscall: err.syscall,
      targetHost: poolConfig.host,
      targetPort: poolConfig.port || 3306,
    });
  }
});

/**
 * POST /db/init - Explicit table initialization
 */
router.post("/db/init", async (req, res) => {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS poll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questions VARCHAR(255) NOT NULL,
        answers VARCHAR(255) NOT NULL,
        votes INT DEFAULT 1,
        date DATE NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.execute(createTableSql);

    return res.status(200).json({
      message: "Poll table structure verified/created successfully.",
    });
  } catch (err) {
    console.error("Failed to initialize database table:", err);
    return res.status(500).json({
      error: "Failed to execute table setup script",
      details: err.message,
    });
  }
});

module.exports = router;
