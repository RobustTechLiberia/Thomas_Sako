
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

function normalizePem(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

const DB_HOST = cleanEnv(process.env.DB_HOST);
const DB_USER = cleanEnv(process.env.DB_USER);
const DB_PASS = cleanEnv(process.env.DB_PASS);
const DB_DATABASE = cleanEnv(process.env.DB_DATABASE);
const DB_PORT = cleanEnv(process.env.DB_PORT);

const SSL_MODE = cleanEnv(process.env.SSL_MODE).toUpperCase();

const DB_SSL_CA = normalizePem(
  cleanEnv(process.env.DB_SSL_CA)
);

const DB_SSL_CA_FILE = cleanEnv(
  process.env.DB_SSL_CA_FILE
);

const DB_SSL_REJECT_UNAUTHORIZED =
  cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !==
  "false";

if (!DB_HOST) {
  console.error("ERROR: DB_HOST is missing.");
}

if (!DB_USER) {
  console.error("ERROR: DB_USER is missing.");
}

if (!DB_PASS) {
  console.error("ERROR: DB_PASS is missing.");
}

if (!DB_DATABASE) {
  console.error("ERROR: DB_DATABASE is missing.");
}

const parsedPort = Number.parseInt(DB_PORT, 10);

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  console.error(
    "ERROR: DB_PORT must be a valid numeric port."
  );
}

function loadCaCertificate() {
  if (DB_SSL_CA) {
    if (!DB_SSL_CA.includes("BEGIN CERTIFICATE")) {
      throw new Error(
        "DB_SSL_CA is configured but does not appear to contain a PEM certificate."
      );
    }

    return {
      source: "DB_SSL_CA environment variable",
      value: DB_SSL_CA,
    };
  }

  if (DB_SSL_CA_FILE) {
    const possiblePaths = [
      path.resolve(__dirname, DB_SSL_CA_FILE),
      path.resolve(process.cwd(), DB_SSL_CA_FILE),
      path.resolve(process.cwd(), "..", DB_SSL_CA_FILE),
      path.resolve(__dirname, "..", "ca.pem"),
      path.resolve(__dirname, "../..", "ca.pem"),
    ];

    for (const certificatePath of possiblePaths) {
      if (fs.existsSync(certificatePath)) {
        const certificate = fs.readFileSync(
          certificatePath,
          "utf8"
        );

        const normalizedCertificate =
          normalizePem(certificate);

        if (
          normalizedCertificate.includes(
            "-----BEGIN CERTIFICATE-----"
          )
        ) {
          return {
            source: certificatePath,
            value: normalizedCertificate,
          };
        }
      }
    }

    throw new Error(
      `DB_SSL_CA_FILE was configured as "${DB_SSL_CA_FILE}", but the CA certificate file could not be found.`
    );
  }

  const fallbackPaths = [
    path.resolve(process.cwd(), "ca.pem"),
    path.resolve(process.cwd(), "../ca.pem"),
    path.resolve(__dirname, "ca.pem"),
    path.resolve(__dirname, "../ca.pem"),
    path.resolve(__dirname, "../../ca.pem"),
  ];

  for (const certificatePath of fallbackPaths) {
    if (fs.existsSync(certificatePath)) {
      const certificate = fs.readFileSync(
        certificatePath,
        "utf8"
      );

      const normalizedCertificate =
        normalizePem(certificate);

      if (
        normalizedCertificate.includes(
          "-----BEGIN CERTIFICATE-----"
        )
      ) {
        return {
          source: certificatePath,
          value: normalizedCertificate,
        };
      }
    }
  }

  return null;
}

let sslConfig = undefined;
let sslCertificateSource = null;

try {
  const caCertificate = loadCaCertificate();

  if (caCertificate) {
    sslCertificateSource = caCertificate.source;

    sslConfig = {
      ca: caCertificate.value,
      rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED,
      minVersion: "TLSv1.2",
    };
  } else {
    if (
      SSL_MODE === "REQUIRED" ||
      SSL_MODE === "REQUIRE"
    ) {
      console.warn(
        "WARNING: SSL is required but no CA certificate was found. TLS will be enabled without CA verification."
      );

      sslConfig = {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      };
    }
  }
} catch (error) {
  console.error(
    "Failed to load MySQL SSL certificate:",
    error.message
  );

  throw error;
}

const poolConfig = {
  host: DB_HOST,
  port: parsedPort,
  user: DB_USER,
  password: DB_PASS,
  database: DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

if (sslConfig) {
  poolConfig.ssl = sslConfig;
}

const pool = mysql.createPool(poolConfig);

function logDatabaseError(prefix, error) {
  console.error(`\n${prefix}`);

  console.error({
    message: error?.message,
    code: error?.code,
    errno: error?.errno,
    sqlState: error?.sqlState,
  });
}

async function handleVoteInsertion(req, res) {
  try {
    const { question, answer } = req.body || {};

    const cleanQuestion =
      typeof question === "string"
        ? question.trim()
        : "";

    const cleanAnswer =
      typeof answer === "string"
        ? answer.trim()
        : "";

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

    const [result] = await pool.execute(
      sql,
      [
        cleanQuestion,
        cleanAnswer,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Vote recorded successfully.",
      id: result.insertId,
      question: cleanQuestion,
      answer: cleanAnswer,
      votes: 1,
    });
  } catch (error) {
    logDatabaseError(
      "Failed to insert vote into MySQL:",
      error
    );

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
      typeof rawQuestion === "string"
        ? rawQuestion.trim()
        : "";

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

    const [rows] = await pool.execute(
      sql,
      [cleanQuestion]
    );

    const formattedResults = rows.map((row) => ({
      answers: row.answers,
      total_votes: Number(row.total_votes) || 0,
    }));

    const totalVotes = formattedResults.reduce(
      (total, item) =>
        total + item.total_votes,
      0
    );

    return res.status(200).json({
      status: "success",
      question: cleanQuestion,
      total_votes: totalVotes,
      results: formattedResults,
    });
  } catch (error) {
    logDatabaseError(
      "Failed to fetch poll analytics:",
      error
    );

    return res.status(500).json({
      status: "error",
      error: "Database analytics retrieval failed.",
      message: error.message,
      code: error.code || "DATABASE_ERROR",
    });
  }
});

router.get("/db", async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      "SELECT 1 AS database_connection"
    );

    return res.status(200).json({
      status: "ok",
      message:
        "Database connection verified successfully.",
      database: DB_DATABASE,
      targetHost: DB_HOST,
      targetPort: parsedPort,
      sslEnabled: Boolean(sslConfig),
      sslVerified:
        Boolean(sslConfig) &&
        sslConfig.rejectUnauthorized === true,
      sslCertificate:
        sslCertificateSource || "not configured",
      test: rows[0],
    });
  } catch (error) {
    logDatabaseError(
      "Database health check failed:",
      error
    );

    return res.status(500).json({
      status: "error",
      error:
        "Database connectivity check failed.",
      message: error.message,
      code:
        error.code ||
        "UNKNOWN_DATABASE_ERROR",
      targetHost: DB_HOST,
      targetPort: parsedPort,
      sslEnabled: Boolean(sslConfig),
      sslVerified:
        Boolean(sslConfig) &&
        sslConfig.rejectUnauthorized === true,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.post("/db/setup", async (req, res) => {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS poll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questions VARCHAR(255) NOT NULL,
        answers VARCHAR(255) NOT NULL,
        votes INT NOT NULL DEFAULT 1,
        date DATE NOT NULL,
        INDEX idx_questions (questions),
        INDEX idx_date (date)
      )
      ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_unicode_ci
    `;

    await pool.execute(createTableSql);

    return res.status(200).json({
      status: "success",
      message:
        "Poll table structure verified/created successfully.",
    });
  } catch (error) {
    logDatabaseError(
      "Failed to initialize poll table:",
      error
    );

    return res.status(500).json({
      status: "error",
      error:
        "Failed to execute table setup script.",
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
      port: parsedPort,
      user: DB_USER,
      database: DB_DATABASE,
    },
    ssl: {
      enabled: Boolean(sslConfig),
      verified:
        Boolean(sslConfig) &&
        sslConfig.rejectUnauthorized === true,
      certificateSource:
        sslCertificateSource || null,
    },
    environment: {
      nodeEnvironment:
        process.env.NODE_ENV || "development",
    },
  });
});

module.exports = router;