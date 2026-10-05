/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const getSslConfig = () => {
  const rootCertPath = path.join(process.cwd(), "ca.pem");

  if (fs.existsSync(rootCertPath)) {
    return {
      ca: fs.readFileSync(rootCertPath),
      rejectUnauthorized: true,
    };
  }

  if (process.env.DB_SSL_CA) {
    const cleanCert = process.env.DB_SSL_CA.replace(/\\n/g, "\n");
    return {
      ca: cleanCert,
      rejectUnauthorized: true,
    };
  }

  return { rejectUnauthorized: true };
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
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required" });
  }

  const sql = `
    INSERT INTO poll 
      (questions, answers, votes, date) 
    VALUES (?, ?, 1, ?)
  `;

  const todayStr = new Date().toISOString().slice(0, 10);

  pool.query(sql, [question, answer, todayStr], (err, result) => {
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

router.post("/", express.json(), handleVoteInsertion);
router.post("/db", express.json(), handleVoteInsertion);

router.get("/results", (req, res) => {
  const { question } = req.query;

  if (!question) {
    return res.status(400).json({
      error: "Missing 'question' query parameter",
    });
  }

  const sql = `
    SELECT 
      answers,
      COUNT(*) AS total_votes
    FROM poll
    WHERE questions = ?
    GROUP BY answers
  `;

  pool.query(sql, [question], (err, rows) => {
    if (err) {
      console.error("Failed to fetch aggregate poll analytics:", err);
      return res.status(500).json({
        error: "Database analytics retrieval failed",
        details: err.message,
      });
    }

    return res.status(200).json({
      question,
      results: rows,
    });
  });
});

// The application uses the existing database and poll table only. Schema setup
// belongs in an explicit migration process, never in a public application route.
router.get("/db", (req, res) => {
  return res.status(405).json({
    error: "Database setup is disabled. The existing poll table is used as-is.",
  });
});

module.exports = router;
