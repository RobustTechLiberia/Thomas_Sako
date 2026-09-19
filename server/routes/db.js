/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const express = require("express");
const mysql = require("mysql2");

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

const handleVoteInsertion = (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required" });
  }

  const con = mysql.createConnection(dbConfig);

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);
      return res.status(500).json({
        error: "Database connection failed",
      });
    }

    const sql = `
      INSERT INTO poll 
        (questions, answers, votes, date) 
      VALUES (?, ?, 1, ?)
    `;

    const todayStr = new Date().toISOString().slice(0, 10);

    con.query(sql, [question, answer, todayStr], (err, result) => {
      con.end();

      if (err) {
        console.error("Failed to insert vote into MySQL:", err);

        return res.status(500).json({
          error: "Failed to record vote",
        });
      }

      return res.status(201).json({
        message: "Vote recorded successfully!",
        id: result.insertId,
      });
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

  const con = mysql.createConnection(dbConfig);

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);

      return res.status(500).json({
        error: "Database connection failed",
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

    con.query(sql, [question], (err, rows) => {
      con.end();

      if (err) {
        console.error("Failed to fetch aggregate poll analytics:", err);

        return res.status(500).json({
          error: "Database analytics retrieval failed",
        });
      }

      return res.status(200).json({
        question,
        results: rows,
      });
    });
  });
});

/**
 * GET /db
 *
 * Creates the database and poll table if they do not exist.
 */
router.get("/db", (req, res) => {
  const databaseName = dbConfig.database;

  if (!databaseName) {
    return res.status(500).json({
      error: "DB_DATABASE environment variable is not configured",
    });
  }

  const setupConfig = {
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  };

  const con = mysql.createConnection(setupConfig);

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);

      return res.status(500).json({
        error: "Database connection failed",
      });
    }

    console.log("Connected to MySQL Server!");

    /*
     * Database names cannot be parameterized with ?,
     * so validate the name before interpolating it.
     */
    if (!/^[a-zA-Z0-9_$]+$/.test(databaseName)) {
      con.end();

      return res.status(400).json({
        error: "Invalid database name",
      });
    }

    const createDatabaseSql = `
      CREATE DATABASE IF NOT EXISTS \`${databaseName}\`
    `;

    con.query(createDatabaseSql, (err) => {
      if (err) {
        con.end();

        console.error("Database creation failed:", err);

        return res.status(500).json({
          error: "Database creation failed",
        });
      }

      console.log(`Database ${databaseName} created or already exists.`);

      con.changeUser({ database: databaseName }, (err) => {
        if (err) {
          con.end();

          console.error("Failed to switch database:", err);

          return res.status(500).json({
            error: "Database selection failed",
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

        con.query(createTableSql, (err) => {
          if (err) {
            con.end();

            console.error("Table creation failed:", err);

            return res.status(500).json({
              error: "Table creation failed",
            });
          }

          console.log("Poll table created or already exists.");

          /*
           * Verify that the ID column exists.
           */
          const checkColumnSql = `
                SHOW COLUMNS 
                FROM poll 
                LIKE 'id'
              `;

          con.query(checkColumnSql, (err, rows) => {
            if (err) {
              con.end();

              console.error("Failed to verify columns:", err);

              return res.status(500).json({
                error: "Column verification failed",
              });
            }

            if (rows.length === 0) {
              console.log("Invalid table structure detected.");

              con.query("DROP TABLE poll", (err) => {
                if (err) {
                  con.end();

                  console.error("Failed to drop old table:", err);

                  return res.status(500).json({
                    error: "Table rebuild failed",
                  });
                }

                con.query(createTableSql, (err) => {
                  con.end();

                  if (err) {
                    console.error("Failed to recreate table:", err);

                    return res.status(500).json({
                      error: "Database table recreation failed",
                    });
                  }

                  console.log("Poll table successfully recreated.");

                  return res.status(200).json({
                    message: "Poll table successfully recreated",
                  });
                });
              });
            } else {
              con.end();

              console.log("Database verification successful.");

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
