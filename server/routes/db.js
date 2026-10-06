"use strict";

const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.use(express.json());

/*
|--------------------------------------------------------------------------
| Environment helpers
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Database configuration
|--------------------------------------------------------------------------
*/

const DB_HOST = cleanEnv(process.env.DB_HOST);
const DB_USER = cleanEnv(process.env.DB_USER);
const DB_PASS = cleanEnv(process.env.DB_PASS);
const DB_DATABASE = cleanEnv(process.env.DB_DATABASE);

const DB_PORT = Number.parseInt(
  cleanEnv(process.env.DB_PORT),
  10
);

const SSL_MODE = cleanEnv(
  process.env.SSL_MODE
).toUpperCase();

const DB_SSL_CA_FILE = cleanEnv(
  process.env.DB_SSL_CA_FILE
);

const DB_SSL_CA = normalizePem(
  cleanEnv(process.env.DB_SSL_CA)
);

const DB_SSL_REJECT_UNAUTHORIZED =
  cleanEnv(
    process.env.DB_SSL_REJECT_UNAUTHORIZED
  ).toLowerCase() !== "false";

/*
|--------------------------------------------------------------------------
| Validate database configuration
|--------------------------------------------------------------------------
*/

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
  configurationErrors.push(
    "DB_DATABASE is missing."
  );
}

if (
  !Number.isInteger(DB_PORT) ||
  DB_PORT <= 0 ||
  DB_PORT > 65535
) {
  configurationErrors.push(
    "DB_PORT must be a valid TCP port."
  );
}

if (configurationErrors.length > 0) {
  configurationErrors.forEach((error) => {
    console.error(`ERROR: ${error}`);
  });

  throw new Error(
    "Invalid database configuration."
  );
}

/*
|--------------------------------------------------------------------------
| Load Aiven CA certificate
|--------------------------------------------------------------------------
|
| Recommended:
|
| DB_SSL_CA_FILE=./certs/ca.pem
|
| The environment variable should contain the FILE PATH,
| not the actual certificate contents.
|--------------------------------------------------------------------------
*/

function loadCaCertificate() {
  /*
   * Preferred method:
   * DB_SSL_CA contains the certificate itself.
   */
  if (DB_SSL_CA) {
    if (
      !DB_SSL_CA.includes(
        "-----BEGIN CERTIFICATE-----"
      ) ||
      !DB_SSL_CA.includes(
        "-----END CERTIFICATE-----"
      )
    ) {
      throw new Error(
        "DB_SSL_CA is configured but does not contain a valid PEM certificate."
      );
    }

    return {
      source: "DB_SSL_CA environment variable",
      value: DB_SSL_CA,
    };
  }

  /*
   * Recommended method:
   * DB_SSL_CA_FILE=./certs/ca.pem
   */
  if (!DB_SSL_CA_FILE) {
    throw new Error(
      "DB_SSL_CA_FILE is not configured. Set DB_SSL_CA_FILE=./certs/ca.pem"
    );
  }

  /*
   * Resolve relative to the project working directory.
   */
  const caPath = path.resolve(
    process.cwd(),
    DB_SSL_CA_FILE
  );

  console.log(
    "Looking for MySQL CA certificate:"
  );

  console.log(caPath);

  if (!fs.existsSync(caPath)) {
    throw new Error(
      `MySQL CA certificate was not found: ${caPath}`
    );
  }

  const certificate = fs.readFileSync(
    caPath,
    "utf8"
  );

  const normalizedCertificate =
    normalizePem(certificate);

  if (
    !normalizedCertificate.includes(
      "-----BEGIN CERTIFICATE-----"
    )
  ) {
    throw new Error(
      "CA certificate is invalid: BEGIN CERTIFICATE was not found."
    );
  }

  if (
    !normalizedCertificate.includes(
      "-----END CERTIFICATE-----"
    )
  ) {
    throw new Error(
      "CA certificate is invalid: END CERTIFICATE was not found."
    );
  }

  return {
    source: caPath,
    value: normalizedCertificate,
  };
}

/*
|--------------------------------------------------------------------------
| SSL configuration
|--------------------------------------------------------------------------
*/

let sslConfig = undefined;
let sslCertificateSource = null;

if (
  SSL_MODE !== "DISABLED" &&
  SSL_MODE !== "OFF"
) {
  try {
    const caCertificate =
      loadCaCertificate();

    sslCertificateSource =
      caCertificate.source;

    sslConfig = {
      ca: caCertificate.value,

      /*
       * IMPORTANT:
       * Keep certificate verification enabled.
       */
      rejectUnauthorized:
        DB_SSL_REJECT_UNAUTHORIZED,

      /*
       * Aiven requires modern TLS.
       */
      minVersion: "TLSv1.2",
    };

    console.log(
      "=========================================="
    );

    console.log(
      "AIVEN MYSQL SSL CONFIGURATION"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "SSL mode:",
      SSL_MODE
    );

    console.log(
      "CA source:",
      sslCertificateSource
    );

    console.log(
      "CA size:",
      Buffer.byteLength(
        caCertificate.value,
        "utf8"
      ),
      "bytes"
    );

    console.log(
      "rejectUnauthorized:",
      sslConfig.rejectUnauthorized
    );

    console.log(
      "TLS minimum:",
      "TLSv1.2"
    );

    console.log(
      "=========================================="
    );
  } catch (error) {
    console.error(
      "=========================================="
    );

    console.error(
      "MYSQL SSL INITIALIZATION FAILED"
    );

    console.error(
      "=========================================="
    );

    console.error(
      error.message
    );

    console.error(
      "=========================================="
    );

    throw error;
  }
} else {
  console.warn(
    "WARNING: MySQL SSL is disabled."
  );
}

/*
|--------------------------------------------------------------------------
| MySQL pool
|--------------------------------------------------------------------------
*/

const poolConfig = {
  host: DB_HOST,

  port: DB_PORT,

  user: DB_USER,

  password: DB_PASS,

  database: DB_DATABASE,

  waitForConnections: true,

  connectionLimit: 5,

  queueLimit: 0,

  connectTimeout: 30000,

  enableKeepAlive: true,

  keepAliveInitialDelay: 0,
};

if (sslConfig) {
  poolConfig.ssl = sslConfig;
}

/*
|--------------------------------------------------------------------------
| Create MySQL connection pool
|--------------------------------------------------------------------------
*/

const pool = mysql.createPool(
  poolConfig
);

/*
|--------------------------------------------------------------------------
| Database error logger
|--------------------------------------------------------------------------
*/

function logDatabaseError(
  prefix,
  error
) {
  console.error(
    `\n${prefix}`
  );

  console.error({
    message: error?.message,
    code: error?.code,
    errno: error?.errno,
    sqlState: error?.sqlState,
    fatal: error?.fatal,
  });

  /*
   * This is particularly important for your
   * ERR_OUT_OF_RANGE problem.
   */
  if (error?.stack) {
    console.error(
      "\nStack trace:"
    );

    console.error(
      error.stack
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /
|
| Record a vote
|--------------------------------------------------------------------------
*/

async function handleVoteInsertion(
  req,
  res
) {
  try {
    const {
      question,
      answer,
    } = req.body || {};

    const cleanQuestion =
      typeof question === "string"
        ? question.trim()
        : "";

    const cleanAnswer =
      typeof answer === "string"
        ? answer.trim()
        : "";

    if (
      !cleanQuestion ||
      !cleanAnswer
    ) {
      return res.status(400).json({
        status: "error",
        error:
          "Question and answer are required.",
      });
    }

    if (
      cleanQuestion.length > 255
    ) {
      return res.status(400).json({
        status: "error",
        error:
          "Question must not exceed 255 characters.",
      });
    }

    if (
      cleanAnswer.length > 255
    ) {
      return res.status(400).json({
        status: "error",
        error:
          "Answer must not exceed 255 characters.",
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

    const [result] =
      await pool.execute(
        sql,
        [
          cleanQuestion,
          cleanAnswer,
        ]
      );

    return res.status(201).json({
      status: "success",
      message:
        "Vote recorded successfully.",
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
      error:
        "Failed to record vote.",
      message:
        error.message,
      code:
        error.code ||
        "DATABASE_ERROR",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Vote routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  handleVoteInsertion
);

router.post(
  "/vote",
  handleVoteInsertion
);

/*
|--------------------------------------------------------------------------
| GET /results
|
| Get results for a question
|--------------------------------------------------------------------------
*/

router.get(
  "/results",
  async (req, res) => {
    try {
      const rawQuestion =
        req.query.question;

      const cleanQuestion =
        typeof rawQuestion === "string"
          ? rawQuestion.trim()
          : "";

      if (!cleanQuestion) {
        return res.status(400).json({
          status: "error",
          error:
            "Missing 'question' query parameter.",
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

      const [rows] =
        await pool.execute(
          sql,
          [cleanQuestion]
        );

      const formattedResults =
        rows.map((row) => ({
          answers: row.answers,

          total_votes:
            Number(
              row.total_votes
            ) || 0,
        }));

      const totalVotes =
        formattedResults.reduce(
          (total, item) =>
            total +
            item.total_votes,
          0
        );

      return res.status(200).json({
        status: "success",

        question:
          cleanQuestion,

        total_votes:
          totalVotes,

        results:
          formattedResults,
      });
    } catch (error) {
      logDatabaseError(
        "Failed to fetch poll analytics:",
        error
      );

      return res.status(500).json({
        status: "error",

        error:
          "Database analytics retrieval failed.",

        message:
          error.message,

        code:
          error.code ||
          "DATABASE_ERROR",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET /db
|
| Aiven MySQL health check
|--------------------------------------------------------------------------
*/

router.get(
  "/db",
  async (req, res) => {
    let connection;

    try {
      connection =
        await pool.getConnection();

      /*
       * Real database test.
       */
      const [rows] =
        await connection.query(
          "SELECT 1 AS database_connection"
        );

      /*
       * Get MySQL version.
       */
      const [versionRows] =
        await connection.query(
          "SELECT VERSION() AS mysql_version"
        );

      /*
       * Check SSL cipher.
       */
      const [sslRows] =
        await connection.query(
          "SHOW STATUS LIKE 'Ssl_cipher'"
        );

      const sslCipher =
        sslRows.length > 0
          ? sslRows[0].Value
          : null;

      return res.status(200).json({
        status: "ok",

        message:
          "Database connection verified successfully.",

        database:
          DB_DATABASE,

        targetHost:
          DB_HOST,

        targetPort:
          DB_PORT,

        sslEnabled:
          Boolean(sslConfig),

        sslConfiguredForVerification:
          Boolean(
            sslConfig &&
            sslConfig.rejectUnauthorized ===
              true
          ),

        sslCipher:
          sslCipher || null,

        sslConnectionVerified:
          Boolean(sslCipher),

        sslCertificate:
          sslCertificateSource ||
          "not configured",

        mysqlVersion:
          versionRows[0]?.mysql_version ||
          null,

        test:
          rows[0],
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

        message:
          error.message,

        code:
          error.code ||
          "UNKNOWN_DATABASE_ERROR",

        targetHost:
          DB_HOST,

        targetPort:
          DB_PORT,

        sslEnabled:
          Boolean(sslConfig),

        sslConfiguredForVerification:
          Boolean(
            sslConfig &&
            sslConfig.rejectUnauthorized ===
              true
          ),
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /db/setup
|
| Create poll table
|--------------------------------------------------------------------------
*/

router.post(
  "/db/setup",
  async (req, res) => {
    try {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS poll (
          id INT AUTO_INCREMENT PRIMARY KEY,

          questions VARCHAR(255) NOT NULL,

          answers VARCHAR(255) NOT NULL,

          votes INT NOT NULL DEFAULT 1,

          date DATE NOT NULL,

          created_at TIMESTAMP NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

          INDEX idx_questions (questions),

          INDEX idx_date (date),

          INDEX idx_created_at (created_at)

        )
        ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
      `;

      await pool.execute(
        createTableSql
      );

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

        message:
          error.message,

        code:
          error.code ||
          "DATABASE_ERROR",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET /db/config
|
| Never return DB_PASS.
|--------------------------------------------------------------------------
*/

router.get(
  "/db/config",
  (req, res) => {
    return res.status(200).json({
      status: "ok",

      database: {
        host:
          DB_HOST,

        port:
          DB_PORT,

        user:
          DB_USER,

        database:
          DB_DATABASE,
      },

      ssl: {
        enabled:
          Boolean(sslConfig),

        verified:
          Boolean(
            sslConfig &&
            sslConfig.rejectUnauthorized ===
              true
          ),

        certificateSource:
          sslCertificateSource ||
          null,
      },

      environment: {
        nodeEnvironment:
          process.env.NODE_ENV ||
          "development",
      },
    });
  }
);

module.exports = router;