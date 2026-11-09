"use strict";
const express = require("express");
const { getCmsSheetClient, spreadsheetId } = require("./sheets");
const { requireCmsAuth } = require("./Auth/login");
const router = express.Router();
router.get("/votes", requireCmsAuth, async (req, res, next) => { try { const sheets = getCmsSheetClient(); const sheet = String(process.env.GOOGLE_SHEET_NAME || "Sheet1").replace(/'/g, "''"); const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheet}'!A2:E` }); const totals = {}; for (const row of result.data.values || []) { const question = row[1] || "Unknown question"; const answer = row[2] || "No answer"; const votes = Number(row[3] || 1); if (!totals[question]) totals[question] = { question, total: 0, answers: {} }; totals[question].total += votes; totals[question].answers[answer] = (totals[question].answers[answer] || 0) + votes; } return res.json({ success: true, results: Object.values(totals).map((item) => ({ ...item, answers: Object.entries(item.answers).map(([answer, votes]) => ({ answer, votes })) })) }); } catch (error) { return next(error); } });
module.exports = router;
