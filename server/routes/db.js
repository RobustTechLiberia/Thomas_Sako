/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * Dynamically resolves SSL configuration based on present files or variables.
 */
const getSslConfig = () => {
  const certPath = path.join(__dirname, "../ca.pem");
  if (fs.existsSync(certPath)) {
    return { ca: fs.readFileSync(certPath) };
  }
  if (process.env.DB_SSL_CA) {
    return { ca: process.env.DB_SSL_CA };
  }

  // Fallback default: permits self-signed certs safely on hosted database nodes
  return { rejectUnauthorized: false };
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

// Main pool configuration used by your standard endpoint routers
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

/**
 * POST /
 */
router.post("/", express.json(), handleVoteInsertion);

/**
 * POST /db
 */
router.post("/db", express.json(), handleVoteInsertion);

/**
 * GET /results?question=...
 */
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

/**
 * GET /db
 *
 * Safely handles Database creation, table checking, and isolates SSL contexts
 * to prevent handshakes from dropping during runtime user-switching.
 */
router.get("/db", (req, res) => {
  const databaseName = dbConfig.database;

  if (!databaseName) {
    return res.status(500).json({
      error: "DB_DATABASE environment variable is not configured",
    });
  }

  if (!/^[a-zA-Z0-9_$]+$/.test(databaseName)) {
    return res.status(400).json({ error: "Invalid database name" });
  }

  // Configuration for establishing an administrative connection without a selected database
  const setupConfig = {
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port,
    ssl: dbConfig.ssl,
  };

  const setupConnection = mysql.createConnection(setupConfig);

  setupConnection.connect((err) => {
    if (err) {
      console.error("Setup Connection failed:", err);
      return res.status(500).json({
        error: "Database connection failed",
        details: err.message,
      });
    }

    const createDatabaseSql = `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``;

    setupConnection.query(createDatabaseSql, (err) => {
      // Always cleanly close the root connection right away
      setupConnection.end();

      if (err) {
        console.error("Database creation failed:", err);
        return res.status(500).json({
          error: "Database creation failed",
          details: err.message,
        });
      }

      // Establish a fresh new connection mapped precisely to your created database schema
      // This maintains accurate SSL state across the security layer
      const dbSpecificConnection = mysql.createConnection({
        ...setupConfig,
        database: databaseName,
      });

      dbSpecificConnection.connect((err) => {
        if (err) {
          console.error("Database-specific connection failed:", err);
          return res.status(500).json({
            error: "Database selection failed",
            details: err.message,
          });
        }

        const createTableSql = `
          CREATE TABLE IF NOT EXISTS poll (
            id INT AUTO_INCREMENT PRIMARY KEY,
            questions VARCHAR(255) NOT NULL,
            answers VARCHAR(255) NOT NULL,
            votes INT DEFAULT 0,
            date DATE NOT NULL
          )
        `;

        dbSpecificConnection.query(createTableSql, (err) => {
          if (err) {
            dbSpecificConnection.end();
            console.error("Table creation failed:", err);
            return res.status(500).json({
              error: "Table creation failed",
              details: err.message,
            });
          }

          const checkColumnSql = `SHOW COLUMNS FROM poll LIKE 'id'`;

          dbSpecificConnection.query(checkColumnSql, (err, rows) => {
            if (err) {
              dbSpecificConnection.end();
              console.error("Failed to verify columns:", err);
              return res.status(500).json({
                error: "Column verification failed",
                details: err.message,
              });
            }

            if (rows.length === 0) {
              dbSpecificConnection.query("DROP TABLE poll", (err) => {
                if (err) {
                  dbSpecificConnection.end();
                  return res.status(500).json({
                    error: "Table rebuild drop failed",
                    details: err.message,
                  });
                }

                dbSpecificConnection.query(createTableSql, (err) => {
                  dbSpecificConnection.end();
                  if (err) {
                    return res.status(500).json({
                      error: "Database table recreation failed",
                      details: err.message,
                    });
                  }
                  return res.status(200).json({
                    message: "Poll table successfully recreated",
                  });
                });
              });
            } else {
              dbSpecificConnection.end();
              return res.status(200).json({
                message: "Database and poll table are ready",
              });
            }
          });
        });
      });
    });
  });
});

module.exports = router;
