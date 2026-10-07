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
    .replace(/^["']|["']\$/g, "");
}

const DB_HOST = cleanEnv(process.env.DB_HOST);
const DB_USER = cleanEnv(process.env.DB_USER);
const DB_PASS = cleanEnv(process.env.DB_PASS);
const DB_DATABASE = cleanEnv(process.env.DB_DATABASE);
const DB_PORT = Number.parseInt(cleanEnv(process.env.DB_PORT), 10);
const DB_SSL_CA_FILE = cleanEnv(process.env.DB_SSL_CA_FILE);
const DB_SSL_REJECT_UNAUTHORIZED =
  cleanEnv(process.env.DB_SSL_REJECT_UNAUTHORIZED).toLowerCase() !== "false";

function loadCaCertificate() {
  if (!DB_SSL_CA_FILE) {
    throw new Error("DB_SSL_CA_FILE is missing from environment variables.");
  }

  const caPath = path.resolve(process.cwd(), DB_SSL_CA_FILE);

  if (!fs.existsSync(caPath)) {
    throw new Error(`MySQL CA certificate was not found at: ${caPath}`);
  }

  const certificate = fs.readFileSync(caPath, "utf8");
  if (!certificate || certificate.trim().length === 0) {
    throw new Error("MySQL CA certificate file is empty.");
  }

  return certificate;
}

let pool;

function getPool() {
  if (pool) return pool;

  const configurationErrors = [];
  if (!DB_HOST) configurationErrors.push("DB_HOST is missing.");
  if (!DB_USER) configurationErrors.push("DB_USER is missing.");
  if (!DB_PASS) configurationErrors.push("DB_PASS is missing.");
  if (!DB_DATABASE) configurationErrors.push("DB_DATABASE is missing.");
  if (!Number.isInteger(DB_PORT) || DB_PORT <= 0 || DB_PORT > 65535) {
    configurationErrors.push("DB_PORT must be a valid TCP port (1-65535).");
  }

  if (configurationErrors.length > 0) {
    throw new Error(
      `Invalid database configuration: ${configurationErrors.join(" ")}`,
    );
  }

  const caCert = loadCaCertificate();

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_DATABASE,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 2, // Low connection limit prevents Vercel from maxing out Aiven's connection limits
    queueLimit: 0,
    ssl: {
      ca: caCert,
      rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED,
    },
    flags: "-SESSION_TRACK", // Prevents the ERR_OUT_OF_RANGE error on Aiven
  });

  return pool;
}

router.get("/db", async (req, res) => {
  try {
    const dbPool = getPool();
    const [rows] = await dbPool.query("SELECT 1 + 1 AS result");
    res.status(200).json({
      success: true,
      message: "Connected to Aiven MySQL!",
      data: rows,
    });
  } catch (error) {
    console.error("Database query error:", error.message);
    res.status(500).json({
      status: "error",
      error: "Database connectivity check failed.",
      message: error.message,
      targetHost: DB_HOST,
      targetPort: DB_PORT,
    });
  }
});

// Export both the router and a utility to grab the pool in other routes
module.exports = {
  router,
  getPool,
};
