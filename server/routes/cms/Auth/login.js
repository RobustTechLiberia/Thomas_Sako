"use strict";

const crypto = require("crypto");
const express = require("express");
const { getCmsSheetClient, ensureCmsSheets, getSheetRows } = require("../sheets");
const { spreadsheetId } = require("../sheets");
const nodemailer = require("nodemailer");

const router = express.Router();
const SESSION_TTL = 1000 * 60 * 60 * 5;
const RESET_TTL = 1000 * 60 * 60 * 5;
const ADMIN_EMAIL = "gabrielwkun@gmail.com";
const attempts = new Map();

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}
function sign(value) { return crypto.createHmac("sha256", process.env.CMS_SESSION_SECRET || process.env.GOOGLE_PRIVATE_KEY || "change-me").update(value).digest("base64url"); }
function rateLimit(key) { const now = Date.now(); const item = attempts.get(key) || { count: 0, start: now }; if (now - item.start > 15 * 60 * 1000) { attempts.set(key, { count: 1, start: now }); return false; } item.count += 1; attempts.set(key, item); return item.count > 10; }

function clean(value) {
  return String(value || "").trim();
}

function newSession(username) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + SESSION_TTL })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function requireCmsAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, signature] = token.split(".");
  const expectedSignature = sign(payload);
  if (!payload || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    return res.status(401).json({ success: false, error: "Please sign in to continue." });
  }
  try { const session = JSON.parse(Buffer.from(payload, "base64url").toString()); if (!session.username || session.exp < Date.now()) throw new Error("expired"); req.cmsUser = session.username; } catch { return res.status(401).json({ success: false, error: "Please sign in to continue." }); }
  return next();
}

router.post("/login", async (req, res) => {
  try {
    if (rateLimit(`login:${req.ip}`)) return res.status(429).json({ success: false, error: "Too many attempts. Try again later." });
    const username = clean(req.body?.username);
    const password = clean(req.body?.password);
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required." });
    }

    const sheets = getCmsSheetClient();
    await ensureCmsSheets(sheets);
    const rows = await getSheetRows(sheets, "CMS_Users!A2:D");
    const user = rows.find((row) => clean(row[0]).toLowerCase() === username.toLowerCase());

    const storedHash = clean(user?.[1]);
    const suppliedHash = hashPassword(password);
    if (!user || storedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(suppliedHash))) {
      return res.status(401).json({ success: false, error: "Incorrect username or password." });
    }

    return res.status(200).json({
      success: true,
      token: newSession(clean(user[0])),
      user: { username: clean(user[0]), role: clean(user[2]) || "Editor" },
    });
  } catch (error) {
    console.error("CMS login failed:", error.message);
    return res.status(503).json({ success: false, error: "CMS storage is not ready." });
  }
});

router.post("/logout", requireCmsAuth, (req, res) => res.status(200).json({ success: true }));

router.post("/password-reset/request", async (req, res) => {
  try {
    if (rateLimit(`reset:${req.ip}`)) return res.status(429).json({ success: false, error: "Too many requests. Try again later." });
    const username = clean(req.body?.username); const sheets = getCmsSheetClient(); await ensureCmsSheets(sheets);
    const rows = await getSheetRows(sheets, "CMS_Users!A2:G"); const index = rows.findIndex((row) => clean(row[0]).toLowerCase() === username.toLowerCase());
    if (index >= 0) { const code = String(crypto.randomInt(100000, 1000000)); const expires = new Date(Date.now() + RESET_TTL).toISOString(); const row = [...rows[index], "", "", ""]; row[4] = hashPassword(code); row[5] = expires; row[6] = new Date().toISOString(); await sheets.spreadsheets.values.update({ spreadsheetId, range: `CMS_Users!A${index + 2}:G${index + 2}`, valueInputOption: "RAW", requestBody: { values: [row.slice(0, 7)] } }); const transport = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } }); if (process.env.EMAIL_USER && process.env.EMAIL_PASS) await transport.sendMail({ from: process.env.EMAIL_USER, to: ADMIN_EMAIL, subject: "1847 Liberty CMS password-reset code", text: `A password reset was requested for ${username}. Your verification code is ${code}. It expires in 5 hours.` }); }
    return res.json({ success: true, message: "If the account exists, a verification code was sent to the administrator." });
  } catch (error) { console.error("Password reset request failed:", error.message); return res.status(503).json({ success: false, error: "Password reset is temporarily unavailable." }); }
});

router.post("/password-reset/confirm", async (req, res) => {
  try {
    const username = clean(req.body?.username); const code = clean(req.body?.code); const password = String(req.body?.password || "");
    if (!username || !/^\d{6}$/.test(code) || password.length < 12) return res.status(400).json({ success: false, error: "Provide the six-digit code and a password of at least 12 characters." });
    const sheets = getCmsSheetClient(); await ensureCmsSheets(sheets); const rows = await getSheetRows(sheets, "CMS_Users!A2:G"); const index = rows.findIndex((row) => clean(row[0]).toLowerCase() === username.toLowerCase()); const row = index >= 0 ? [...rows[index], "", "", ""] : null;
    const codeHash = hashPassword(code); if (!row || !row[5] || clean(row[4]).length !== codeHash.length || new Date(row[5]).getTime() < Date.now() || !crypto.timingSafeEqual(Buffer.from(clean(row[4])), Buffer.from(codeHash))) return res.status(400).json({ success: false, error: "That code is invalid or expired." });
    row[1] = hashPassword(password); row[4] = ""; row[5] = ""; row[6] = ""; await sheets.spreadsheets.values.update({ spreadsheetId, range: `CMS_Users!A${index + 2}:G${index + 2}`, valueInputOption: "RAW", requestBody: { values: [row.slice(0, 7)] } }); return res.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (error) { console.error("Password reset confirmation failed:", error.message); return res.status(503).json({ success: false, error: "Password reset is temporarily unavailable." }); }
});

module.exports = { router, requireCmsAuth, hashPassword };
