"use strict";

const crypto = require("crypto");
const express = require("express");
const { google } = require("googleapis");

const router = express.Router();
const VOTE_WINDOW_MS = 24 * 60 * 60 * 1000;

function getConfiguration() {
  const configuration = {
    projectId: (process.env.GOOGLE_PROJECT_ID || "").trim(),
    clientEmail: (process.env.GOOGLE_CLIENT_EMAIL || "").trim(),
    clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
    privateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    spreadsheetId: (process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET || "").trim(),
    sheetName: (process.env.GOOGLE_SHEET_NAME || "Sheet1").trim(),
    tokenUri: (process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token").trim(),
  };
  const required = [
    ["GOOGLE_PROJECT_ID", configuration.projectId],
    ["GOOGLE_CLIENT_EMAIL", configuration.clientEmail],
    ["GOOGLE_CLIENT_ID", configuration.clientId],
    ["GOOGLE_PRIVATE_KEY", configuration.privateKey],
    ["GOOGLE_SHEETS_ID (or GOOGLE_SHEET)", configuration.spreadsheetId],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (configuration.privateKey && !isValidPrivateKey(configuration.privateKey)) {
    missing.push("GOOGLE_PRIVATE_KEY must be a complete, valid PKCS#8 PEM key");
  }

  return { configuration, missing };
}

function normalizePrivateKey(value) {
  let key = String(value || "").trim();

  if (
    key.length >= 2 &&
    ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'")))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\r?\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

function isValidPrivateKey(privateKey) {
  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    return false;
  }

  try {
    crypto.createPrivateKey({ key: privateKey, format: "pem", type: "pkcs8" });
    return true;
  } catch {
    return false;
  }
}

function getVoteCookieName(question) {
  const digest = crypto.createHash("sha256").update(question).digest("hex").slice(0, 20);
  return `poll_vote_${digest}`;
}

function hasCookie(req, name) {
  return (req.headers.cookie || "").split(";").some((part) => part.trim().startsWith(`${name}=`));
}

router.post("/vote", async (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const answer = typeof req.body?.answer === "string" ? req.body.answer.trim() : "";
  if (!question || !answer || question.length > 500 || answer.length > 500) {
    return res.status(400).json({ success: false, error: "A valid question and answer are required." });
  }

  const cookieName = getVoteCookieName(question);
  if (hasCookie(req, cookieName)) {
    return res.status(429).json({ success: false, error: "You have already voted on this question. Please try again tomorrow." });
  }

  const { configuration, missing } = getConfiguration();
  if (missing.length > 0) {
    console.error("Google Sheets configuration is incomplete:", missing.join(", "));
    return res.status(503).json({
      success: false,
      error: "Voting is temporarily unavailable because the Google Sheets credentials are invalid.",
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account", project_id: configuration.projectId,
        private_key: configuration.privateKey, client_email: configuration.clientEmail,
        client_id: configuration.clientId, token_uri: configuration.tokenUri,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const timestamp = new Date().toISOString();
    const range = `'${configuration.sheetName.replace(/'/g, "''")}'!A:E`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: configuration.spreadsheetId, range, valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[timestamp, question, answer, 1, timestamp.slice(0, 10)]] },
    });
    res.cookie(cookieName, "1", {
      maxAge: VOTE_WINDOW_MS, httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production", path: "/",
    });
    return res.status(201).json({ success: true, message: "Your vote has been recorded." });
  } catch (error) {
    console.error("Unable to record vote:", error.message);
    return res.status(502).json({ success: false, error: "Unable to record your vote. Please try again later." });
  }
});

module.exports = router;
