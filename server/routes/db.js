"use strict";

require("dotenv").config();

const { createPrivateKey } = require("crypto");
const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

router.use(express.json({ limit: "1mb" }));

const GOOGLE_PROJECT_ID = (process.env.GOOGLE_PROJECT_ID || "").trim();
const GOOGLE_CLIENT_EMAIL = (process.env.GOOGLE_CLIENT_EMAIL || "").trim();
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_TOKEN_URI = (
  process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token"
).trim();

const SPREADSHEET_ID = (
  process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET || ""
).trim();
const SHEET_NAME = (process.env.GOOGLE_SHEET_NAME || "Sheet1").trim();

function normalizePrivateKey(value) {
  let key = String(value || "").trim();

  // Deployment dashboards commonly store newlines either literally or as \n.
  // They also sometimes retain a pair of wrapping quotes when copied from JSON.
  if (
    key.length >= 2 &&
    ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'")))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\r?\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

const PRIVATE_KEY = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

function getPrivateKeyError() {
  if (!PRIVATE_KEY) {
    return "GOOGLE_PRIVATE_KEY is missing.";
  }

  if (
    !PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----") ||
    !PRIVATE_KEY.includes("-----END PRIVATE KEY-----")
  ) {
    return "GOOGLE_PRIVATE_KEY must be the complete private_key value from the Google service-account JSON file.";
  }

  try {
    createPrivateKey({ key: PRIVATE_KEY, format: "pem", type: "pkcs8" });
    return null;
  } catch {
    return "GOOGLE_PRIVATE_KEY is not a valid PKCS#8 PEM key. Replace it with the complete private_key value from a newly downloaded Google service-account JSON file.";
  }
}

let sheetsClient;

function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const missing = [];

  if (!GOOGLE_PROJECT_ID) missing.push("GOOGLE_PROJECT_ID");
  if (!GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!SPREADSHEET_ID) missing.push("GOOGLE_SHEETS_ID (or GOOGLE_SHEET)");
  const privateKeyError = getPrivateKeyError();
  if (privateKeyError) missing.push(privateKeyError);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const credentials = {
    type: "service_account",
    project_id: GOOGLE_PROJECT_ID,
    private_key: PRIVATE_KEY,
    client_email: GOOGLE_CLIENT_EMAIL,
    client_id: GOOGLE_CLIENT_ID,
    token_uri: GOOGLE_TOKEN_URI,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({
    version: "v4",
    auth,
  });

  return sheetsClient;
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

router.get("/db", async (req, res) => {
  try {
    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: "spreadsheetId,properties.title",
    });

    return res.status(200).json({
      success: true,
      message: "Google Sheets connection successful.",
      projectId: GOOGLE_PROJECT_ID,
      serviceAccount: GOOGLE_CLIENT_EMAIL,
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetTitle: response.data.properties?.title || "",
    });
  } catch (error) {
    console.error("Google Sheets connection failed:", error.message);

    return res.status(500).json({
      success: false,
      error: "Google Sheets connection failed.",
      message: error.message,
    });
  }
});

router.post("/db", async (req, res) => {
  try {
    const sheets = getSheetsClient();

    const question = cleanText(req.body?.question ?? req.body?.questions);

    const answer = cleanText(req.body?.answer ?? req.body?.answers);

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Both question and answer are required.",
      });
    }

    const votes = Number(req.body?.votes ?? 1);

    if (!Number.isSafeInteger(votes) || votes < 1) {
      return res.status(400).json({
        success: false,
        message: "Votes must be a positive integer.",
      });
    }

    const timestamp = new Date().toISOString();
    const date = cleanText(req.body?.date) || timestamp.slice(0, 10);

    const values = [[timestamp, question, answer, votes, date]];
    const range = `'${SHEET_NAME.replace(/'/g, "''")}'!A:E`;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Poll data inserted into Google Sheets successfully.",
      updatedRange: response.data.updates?.updatedRange || null,
      data: {
        timestamp,
        question,
        answer,
        votes,
        date,
      },
    });
  } catch (error) {
    console.error("Google Sheets insertion failed:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to insert poll data into Google Sheets.",
      message: error.message,
    });
  }
});

module.exports = router;
