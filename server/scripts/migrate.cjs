const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const getSslConfig = () => {
  const configuredValue = process.env.DB_SSL_CA || process.env.DB_SSL_CA_FILE;

  if (configuredValue?.includes("BEGIN CERTIFICATE")) {
    return {
      ca: configuredValue.replace(/\\n/g, "\n"),
      rejectUnauthorized: true,
    };
  }

  const certificatePath = configuredValue
    ? path.resolve(__dirname, "..", configuredValue)
    : path.resolve(__dirname, "../..", "ca.pem");

  if (!fs.existsSync(certificatePath)) {
    throw new Error("Aiven CA certificate was not found.");
  }

  return {
    ca: fs.readFileSync(certificatePath),
    rejectUnauthorized: true,
  };
};

const requiredVariables = ["DB_HOST", "DB_USER", "DB_PASS", "DB_DATABASE"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(`Missing database settings: ${missingVariables.join(", ")}`);
}

const createPollTable = `
  CREATE TABLE IF NOT EXISTS poll (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    questions VARCHAR(1000) NOT NULL,
    answers VARCHAR(1000) NOT NULL,
    votes INT UNSIGNED NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_poll_question_date (questions(255), date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    ssl: getSslConfig(),
  });

  try {
    await connection.query(createPollTable);
    console.log("Database migration complete: poll table is ready.");
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});
