"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.use(express.json());

function cleanEnv(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const DB_HOST = cleanEnv(process.env.DB_HOST);
const DB_USER = cleanEnv(process.env.DB_USER);
const DB_PASS = cleanEnv(process.env.DB_PASS);
const DB_DATABASE = cleanEnv(process.env.DB_DATABASE);

const DB_PORT = Number.parseInt(cleanEnv(process.env.DB_PORT), 10);

const SSL_MODE = cleanEnv(process.env.SSL_MODE).toUpperCase();

const DB_SSL_CA_FILE = cleanEnv(process.env.DB_SSL_CA_FILE);

const DB_SSL_REJECT_UNAUTHORIZED =
  cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== "false";

const configurationErrors = [];

if (!DB_HOST) {
  configurationErrors.push("DB_HOST is missing.");
}

if (!DB_USER) {
  configurationErrors.push("DB_USER is missing.");
}

if (!DB_PASS) {
  configurationErrors.push("DB_PASS is missing.");
}

if (!DB_DATABASE) {
  configurationErrors.push("DB_DATABASE is missing.");
}

if (!Number.isInteger(DB_PORT) || DB_PORT <= 0 || DB_PORT > 65535) {
  configurationErrors.push("DB_PORT must be a valid TCP port.");
}

if (configurationErrors.length > 0) {
  configurationErrors.forEach((error) => {
    console.error(`ERROR: ${error}`);
  });

  throw new Error("Invalid database configuration.");
}

function loadCaCertificate() {
  if (!DB_SSL_CA_FILE) {
    throw new Error("DB_SSL_CA_FILE is missing.");
  }

  const caPath = path.resolve(process.cwd(), DB_SSL_CA_FILE);

  console.log("MySQL CA certificate:", caPath);

  if (!fs.existsSync(caPath)) {
    throw new Error(`MySQL CA certificate was not found: ${caPath}`);
  }

  const certificate = fs.readFileSync(caPath);

  if (certificate.length === 0) {
    throw new Error("MySQL CA certificate is empty.");
  }

  const certificateText = certificate.toString("utf8");

  if (!certificateText.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("CA certificate does not contain BEGIN CERTIFICATE.");
  }

  if (!certificateText.includes("-----END CERTIFICATE-----")) {
    throw new Error("CA certificate does not contain END CERTIFICATE.");
  }

  return {
    path: caPath,
    buffer: certificate,
  };
}

let sslConfig;
let sslCertificateSource = null;

if (SSL_MODE !== "DISABLED" && SSL_MODE !== "OFF") {
  const caCertificate = loadCaCertificate();

  sslCertificateSource = caCertificate.path;

  sslConfig = {
    ca: caCertificate.buffer,
    rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED,
    minVersion: "TLSv1.2",
  };

  console.log("==========================================");
  console.log("AIVEN MYSQL SSL CONFIGURATION");
  console.log("==========================================");
  console.log("SSL mode:", SSL_MODE);
  console.log("CA:", sslCertificateSource);
  console.log("CA bytes:", caCertificate.buffer.length);
  console.log("rejectUnauthorized:", DB_SSL_REJECT_UNAUTHORIZED);
  console.log("TLS minimum: TLSv1.2");
  console.log("==========================================");
} else {
  console.warn("WARNING: MySQL SSL is disabled.");
}

function getMysqlConfig() {
  const config = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_DATABASE,
    connectTimeout: 30000,
  };

  if (sslConfig) {
    config.ssl = sslConfig;
  }

  return config;
}

const poolConfig = {
  ...getMysqlConfig(),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

const pool = mysql.createPool(poolConfig);

function logDatabaseError(prefix, error) {
  console.error("");
  console.error("==========================================");
  console.error(prefix);
  console.error("==========================================");

  console.error("name:", error?.name);

  console.error("message:", error?.message);

  console.error("code:", error?.code);

  console.error("errno:", error?.errno);

  console.error("sqlState:", error?.sqlState);

  console.error("fatal:", error?.fatal);

  console.error("syscall:", error?.syscall);

  console.error("address:", error?.address);

  console.error("port:", error?.port);

  console.error("");
  console.error("FULL STACK:");

  console.error(error?.stack || error);

  console.error("==========================================");
}

async function handleVoteInsertion(req, res) {
  try {
    const { question, answer } = req.body || {};

    const cleanQuestion = typeof question === "string" ? question.trim() : "";

    const cleanAnswer = typeof answer === "string" ? answer.trim() : "";

    if (!cleanQuestion || !cleanAnswer) {
      return res.status(400).json({
        status: "error",
        error: "Question and answer are required.",
      });
    }

    if (cleanQuestion.length > 255) {
      return res.status(400).json({
        status: "error",
        error: "Question must not exceed 255 characters.",
      });
    }

    if (cleanAnswer.length > 255) {
      return res.status(400).json({
        status: "error",
        error: "Answer must not exceed 255 characters.",
      });
    }

    const sql = `
      INSERT INTO poll
      (
        questions,
        answers,
        votes,
        date
      )
      VALUES (?, ?, 1, CURDATE())
    `;

    const [result] = await pool.execute(sql, [cleanQuestion, cleanAnswer]);

    return res.status(201).json({
      status: "success",
      message: "Vote recorded successfully.",
      id: result.insertId,
      question: cleanQuestion,
      answer: cleanAnswer,
      votes: 1,
    });
  } catch (error) {
    logDatabaseError("Failed to insert vote into MySQL", error);

    return res.status(500).json({
      status: "error",
      error: "Failed to record vote.",
      message: error.message,
      code: error.code || "DATABASE_ERROR",
    });
  }
}

router.post("/", handleVoteInsertion);

router.post("/vote", handleVoteInsertion);

router.get("/results", async (req, res) => {
  try {
    const rawQuestion = req.query.question;

    const cleanQuestion =
      typeof rawQuestion === "string" ? rawQuestion.trim() : "";

    if (!cleanQuestion) {
      return res.status(400).json({
        status: "error",
        error: "Missing 'question' query parameter.",
      });
    }

    const sql = `
        SELECT
          answers,
          SUM(votes) AS total_votes
        FROM poll
        WHERE questions = ?
        GROUP BY answers
        ORDER BY total_votes DESC
      `;

    const [rows] = await pool.execute(sql, [cleanQuestion]);

    const formattedResults = rows.map((row) => ({
      answers: row.answers,
      total_votes: Number(row.total_votes) || 0,
    }));

    const totalVotes = formattedResults.reduce(
      (total, item) => total + item.total_votes,
      0,
    );

    return res.status(200).json({
      status: "success",
      question: cleanQuestion,
      total_votes: totalVotes,
      results: formattedResults,
    });
  } catch (error) {
    logDatabaseError("Failed to fetch poll analytics", error);

    return res.status(500).json({
      status: "error",
      error: "Database analytics retrieval failed.",
      message: error.message,
      code: error.code || "DATABASE_ERROR",
    });
  }
});

router.get("/db/raw-test", async (req, res) => {
  let connection;

  try {
    console.log("Starting direct MySQL connection...");

    connection = await mysql.createConnection(getMysqlConfig());

    console.log("Direct MySQL connection established.");

    const [rows] = await connection.query("SELECT 1 AS connected");

    const [version] = await connection.query("SELECT VERSION() AS version");

    const [ssl] = await connection.query("SHOW STATUS LIKE 'Ssl_cipher'");

    const sslCipher = ssl.length > 0 ? ssl[0].Value || null : null;

    await connection.end();

    return res.status(200).json({
      status: "success",
      message: "Direct MySQL connection successful.",
      connected: rows[0]?.connected === 1,
      mysqlVersion: version[0]?.version || null,
      sslCipher,
      sslVerified: Boolean(sslCipher),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (_) {}
    }

    logDatabaseError("DIRECT MYSQL TEST FAILED", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code || null,
      errno: error.errno || null,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.get("/db", async (req, res) => {
  let connection;

  try {
    connection = await mysql.createConnection(getMysqlConfig());

    const [connectionRows] = await connection.query(
      "SELECT 1 AS database_connection",
    );

    const [versionRows] = await connection.query(
      "SELECT VERSION() AS mysql_version",
    );

    const [sslRows] = await connection.query("SHOW STATUS LIKE 'Ssl_cipher'");

    const sslCipher = sslRows.length > 0 ? sslRows[0].Value || null : null;

    await connection.end();

    return res.status(200).json({
      status: "success",
      message: "Database connection successful.",
      database: DB_DATABASE,
      host: DB_HOST,
      port: DB_PORT,
      mysqlVersion: versionRows[0]?.mysql_version || null,
      ssl: {
        enabled: Boolean(sslConfig),
        cipher: sslCipher,
        verified: Boolean(sslCipher),
      },
      connectionTest: connectionRows[0]?.database_connection === 1,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (_) {}
    }

    logDatabaseError("AIVEN MYSQL CONNECTION FAILED", error);

    return res.status(500).json({
      status: "error",
      error: "Database connectivity check failed.",
      message: error.message,
      code: error.code || null,
      errno: error.errno || null,
      host: DB_HOST,
      port: DB_PORT,
      sslEnabled: Boolean(sslConfig),
      certificateSource: sslCertificateSource,
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
          votes INT NOT NULL DEFAULT 1,
          date DATE NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_questions (questions),
          INDEX idx_date (date),
          INDEX idx_created_at (created_at)
        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
      `;

    await pool.execute(createTableSql);

    return res.status(200).json({
      status: "success",
      message: "Poll table structure verified/created successfully.",
    });
  } catch (error) {
    logDatabaseError("Failed to initialize poll table", error);

    return res.status(500).json({
      status: "error",
      error: "Failed to execute table setup script.",
      message: error.message,
      code: error.code || "DATABASE_ERROR",
    });
  }
});

router.get("/db/config", (req, res) => {
  return res.status(200).json({
    status: "ok",
    database: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      database: DB_DATABASE,
    },
    ssl: {
      enabled: Boolean(sslConfig),
      rejectUnauthorized: Boolean(sslConfig?.rejectUnauthorized),
      certificateSource: sslCertificateSource,
    },
    environment: {
      nodeVersion: process.version,
      nodeEnvironment: process.env.NODE_ENV || "development",
      mysql2Version: require("mysql2/package.json").version,
    },
  });
});

module.exports = router;
