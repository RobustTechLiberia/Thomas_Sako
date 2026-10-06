const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.use(express.json());

const cleanEnv = (val) => (val ? val.trim().replace(/^["']|["']$/g, "") : "");

const rawHost = cleanEnv(process.env.DB_HOST);
const rawUser = cleanEnv(process.env.DB_USER);
const rawPass = cleanEnv(process.env.DB_PASS);
const rawDb = cleanEnv(process.env.DB_DATABASE);
const rawPort = cleanEnv(process.env.DB_PORT);

const getSslConfig = () => {
  const inlineCa = cleanEnv(process.env.DB_SSL_CA);
  if (inlineCa) {
    return {
      ca: inlineCa.replace(/\\n/g, "\n"),
      rejectUnauthorized:
        cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED) !== "false",
    };
  }

  const rawCaFile = cleanEnv(process.env.DB_SSL_CA_FILE);

  if (rawCaFile && rawCaFile.includes("BEGIN CERTIFICATE")) {
    return {
      ca: rawCaFile.replace(/\\n/g, "\n"),
      rejectUnauthorized:
        cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED) !== "false",
    };
  }

  const configuredPath = rawCaFile
    ? path.resolve(__dirname, "..", rawCaFile)
    : null;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return {
      ca: fs.readFileSync(configuredPath),
      rejectUnauthorized:
        cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED) !== "false",
    };
  }

  const rootCertPath = path.resolve(__dirname, "../../ca.pem");
  if (fs.existsSync(rootCertPath)) {
    return {
      ca: fs.readFileSync(rootCertPath),
      rejectUnauthorized:
        cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED) !== "false",
    };
  }

  if (rawHost && rawHost.includes("aivencloud.com")) {
    return {
      rejectUnauthorized: false,
    };
  }

  return undefined;
};

const poolConfig = {
  host: rawHost,
  user: rawUser,
  password: rawPass,
  database: rawDb,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
};

if (rawPort) {
  poolConfig.port = parseInt(rawPort, 10);
}

const sslConfig = getSslConfig();
if (sslConfig) {
  poolConfig.ssl = sslConfig;
}

const pool = mysql.createPool(poolConfig);

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
        port: poolConfig.port,
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
      targetHost: poolConfig.host,
      targetPort: poolConfig.port,
    });
  }
});

router.post("/db", async (req, res) => {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS poll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questions VARCHAR(255) NOT NULL,
        answers VARCHAR(255) NOT NULL,
        votes INT DEFAULT 1,
        date DATE NOT NULL
      )
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
