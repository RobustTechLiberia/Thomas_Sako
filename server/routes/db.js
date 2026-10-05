const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// 1. FIXED: Apply JSON middleware universally across the router level 
// This guarantees req.body is parsed perfectly for both POST endpoints.
router.use(express.json());

const getSslConfig = () => {
  if (process.env.DB_SSL_CA) {
    return {
      ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  if (process.env.DB_SSL_CA_FILE?.includes("BEGIN CERTIFICATE")) {
    return {
      ca: process.env.DB_SSL_CA_FILE.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  const configuredCertificatePath = process.env.DB_SSL_CA_FILE
    ? path.resolve(__dirname, "..", process.env.DB_SSL_CA_FILE)
    : null;
  if (configuredCertificatePath && fs.existsSync(configuredCertificatePath)) {
    return {
      ca: fs.readFileSync(configuredCertificatePath),
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

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: getSslConfig(),
};

const pool = mysql.createPool(dbConfig);

const handleVoteInsertion = (req, res) => {
  // Safe validation check against an empty body object
  if (!req.body) {
    return res.status(400).json({ error: "Malformed JSON payload or empty request body." });
  }

  const { question, answer } = req.body;

  if (!question || !answer || !String(question).trim() || !String(answer).trim()) {
    return res.status(400).json({ error: "Question and answer are required" });
  }

  const sql = `
    INSERT INTO poll 
      (questions, answers, votes, date) 
    VALUES (?, ?, 1, ?)
  `;

  const todayStr = new Date().toISOString().slice(0, 10);

  pool.query(sql, [String(question).trim(), String(answer).trim(), todayStr], (err, result) => {
    if (err) {
      console.error("Failed to insert vote into MySQL:", err);
      return res.status(500).json({
        error: "Failed to record vote",
        details: err.message,
      });
    }

    return res.status(201).json({
      message: "Vote recorded successfully!",
      id: result.insertId,
    });
  });
};

// 2. FIXED: Route mappings cleaned up to remove redundant middleware definitions
router.post("/", handleVoteInsertion);
router.post("/db", handleVoteInsertion);

router.get("/results", (req, res) => {
  const { question } = req.query;

  if (!question || !String(question).trim()) {
    return res.status(400).json({
      error: "Missing 'question' query parameter",
    });
  }

  // 3. FIXED: Changed COUNT(*) to SUM(votes) to accurately respect the 
  // numerical configuration setup from your INSERT statement.
  const sql = `
    SELECT 
      answers,
      SUM(votes) AS total_votes
    FROM poll
    WHERE questions = ?
    GROUP BY answers
  `;

  pool.query(sql, [String(question).trim()], (err, rows) => {
    if (err) {
      console.error("Failed to fetch aggregate poll analytics:", err);
      return res.status(500).json({
        error: "Database analytics retrieval failed",
        details: err.message,
      });
    }

    // Map rows cleanly to handle parsing integers from the aggregate SUM
    const formattedResults = rows.map(row => ({
      answers: row.answers,
      total_votes: parseInt(row.total_votes, 10) || 0
    }));

    return res.status(200).json({
      question: String(question).trim(),
      results: formattedResults,
    });
  });
});

router.get("/db", (req, res) => {
  return res.status(405).json({
    error: "Database setup is disabled. The existing poll table is used as-is.",
  });
});

module.exports = router;
