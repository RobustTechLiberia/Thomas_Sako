"use strict";

const { createPrivateKey, createHash } = require("crypto");
const { google } = require("googleapis");

const spreadsheetId = String(process.env.GOOGLE_CMS_SHEETS_ID || process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEET_ID || "").trim().replace(/^.*\/spreadsheets\/d\/([\w-]+).*$/, "$1");
const clientEmail = String(process.env.GOOGLE_CLIENT_EMAIL || "").trim();
const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").trim().replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
let client;

function getCmsSheetClient() {
  if (client) return client;
  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("Google Sheets CMS credentials are not configured.");
  }
  createPrivateKey({ key: privateKey, format: "pem", type: "pkcs8" });
  client = google.sheets({
    version: "v4",
    auth: new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    }),
  });
  return client;
}

async function getSheetRows(sheets, range) {
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return result.data.values || [];
}

async function ensureCmsSheets(sheets) {
  const info = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
  const names = new Set((info.data.sheets || []).map((sheet) => sheet.properties.title));
  const requests = [];
  if (!names.has("CMS_Users")) requests.push({ addSheet: { properties: { title: "CMS_Users" } } });
  if (!names.has("CMS_Content")) requests.push({ addSheet: { properties: { title: "CMS_Content" } } });
  if (!names.has("CMS_Pages")) requests.push({ addSheet: { properties: { title: "CMS_Pages" } } });
  if (!names.has("CMS_Settings")) requests.push({ addSheet: { properties: { title: "CMS_Settings" } } });
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  const users = await getSheetRows(sheets, "CMS_Users!A1:G");
  if (!users.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "CMS_Users!A:G",
      valueInputOption: "RAW",
      requestBody: { values: [["username", "password_hash", "role", "created_at", "reset_code_hash", "reset_expires_at", "reset_requested_at"], ["liberty", createHash("sha256").update("liberty@1847").digest("hex"), "Admin", new Date().toISOString(), "", "", ""]] },
    });
  }
  const content = await getSheetRows(sheets, "CMS_Content!A1:I");
  if (!content.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "CMS_Content!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [["id", "title", "slug", "category", "body", "image", "status", "updated_at", "author"]] },
    });
  }
  const pages = await getSheetRows(sheets, "CMS_Pages!A1:H");
  if (!pages.length) await sheets.spreadsheets.values.append({ spreadsheetId, range: "CMS_Pages!A:H", valueInputOption: "RAW", requestBody: { values: [["id", "title", "slug", "body", "show_navigation", "show_feature", "status", "updated_at"]] } });
  const settings = await getSheetRows(sheets, "CMS_Settings!A1:B");
  if (!settings.length) await sheets.spreadsheets.values.append({ spreadsheetId, range: "CMS_Settings!A:B", valueInputOption: "RAW", requestBody: { values: [["key", "value"], ["primary_color", "#830000"], ["accent_color", "#F67D31"], ["text_color", "#1c1917"], ["font_family", "Arimo"], ["base_font_size", "16"], ["theme", "light"]] } });
}

module.exports = { spreadsheetId, getCmsSheetClient, ensureCmsSheets, getSheetRows };
