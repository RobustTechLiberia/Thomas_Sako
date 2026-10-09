"use strict";

const express = require("express");
const crypto = require("crypto");
const { sheets } = require("@googleapis/sheets");

const router = express.Router();

const VOTE_WINDOW_SECONDS = 24 * 60 * 60;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET;

const auth = new sheets.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  scopes: ["https://googleapis.com"],
});

const sheetsClient = sheets({ version: "v4", auth });

const getVoteCookieName = (question) => {
  const hash = crypto
    .createHash("sha256")
    .update(question)
    .digest("hex")
    .slice(0, 20);
  return `poll_vote_${hash}`;
};

const hasVoteCookie = (req, cookieName) => {
  if (
    req.cookies &&
    Object.prototype.hasOwnProperty.call(req.cookies, cookieName)
  ) {
    return true;
  }
  const rawCookies = req.headers.cookie;
  if (!rawCookies) return false;
  return rawCookies.split(";").some((cookieStr) => {
    const parts = cookieStr.trim().split("=");
    return parts[0] === cookieName;
  });
};

router.post("/submit", async (req, res) => {
  if (
    !SPREADSHEET_ID ||
    !process.env.GOOGLE_CLIENT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY
  ) {
    console.error("Google Sheets configuration is incomplete.");
    return res
      .status(503)
      .json({
        error: "Voting is temporarily unavailable. Please try again later.",
      });
  }

  const { question, answer } = req.body || {};
  if (
    typeof question !== "string" ||
    typeof answer !== "string" ||
    !question.trim() ||
    !answer.trim()
  ) {
    return res
      .status(400)
      .json({ error: "Question and answer fields are required." });
  }

  const normalizedQuestion = question.trim();
  const normalizedAnswer = answer.trim();

  if (normalizedQuestion.length > 255 || normalizedAnswer.length > 255) {
    return res
      .status(400)
      .json({ error: "Question and answer must not exceed 255 characters." });
  }

  const voteCookieName = getVoteCookieName(normalizedQuestion);
  if (hasVoteCookie(req, voteCookieName)) {
    return res.status(429).json({
      error: "Submission locked.",
      message:
        "You have already voted on this question. Please try again tomorrow.",
    });
  }

  try {
    const currentDate = new Date().toISOString().split("T")[0];

    const existingData = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:D",
    });

    const rows = existingData.data.values || [];
    const isDuplicateQuestion = rows.some(
      (row) => row[0] === normalizedQuestion && row[3] === currentDate,
    );

    if (isDuplicateQuestion) {
      return res.status(429).json({
        error: "Submission locked.",
        message:
          "This question has already been answered within the last 24 hours.",
      });
    }

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[normalizedQuestion, normalizedAnswer, 1, currentDate]],
      },
    });

    if (typeof res.cookie === "function") {
      res.cookie(voteCookieName, "1", {
        maxAge: VOTE_WINDOW_SECONDS * 1000,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res.status(201).json({
      message: "Vote recorded successfully!",
    });
  } catch (error) {
    console.error("Google Sheets API error:", error.message);
    return res
      .status(500)
      .json({
        error: "Failed to process form submission.",
        code: "SHEETS_ERROR",
      });
  }
});

router.get("/results", async (req, res) => {
  if (!SPREADSHEET_ID) {
    return res
      .status(503)
      .json({ error: "Analytics service is currently unavailable." });
  }

  const { question } = req.query;
  if (typeof question !== "string" || !question.trim()) {
    return res
      .status(400)
      .json({ error: "Question query parameter is required." });
  }

  const targetQuestion = question.trim();

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:C",
    });

    const rows = response.data.values || [];
    const voteCounts = {};

    rows.forEach((row) => {
      const [q, answer, votes] = row;
      if (q === targetQuestion && answer) {
        const voteNum = parseInt(votes, 10) || 0;
        voteCounts[answer] = (voteCounts[answer] || 0) + voteNum;
      }
    });

    const results = Object.entries(voteCounts).map(
      ([answers, total_votes]) => ({
        answers,
        total_votes,
      }),
    );

    return res.status(200).json({ question: targetQuestion, results });
  } catch (error) {
    console.error("Google Sheets API error fetching results:", error.message);
    return res.status(500).json({ error: "Failed to fetch poll results." });
  }
});

module.exports = router;
