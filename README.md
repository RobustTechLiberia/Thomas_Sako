# Documentation

## Overview
This project is a multi-page portfolio clone of the official website for U.S. podcast host Michael Smerconish. The platform aggregates high-profile guest interviews, podcasts, playlists, and video content. It includes a custom time-locked polling engine and an advertisement management system.

---

## Architecture
*   **Frontend:** ReactJS, TailwindCSS, React Router
*   **Backend:** NodeJS, ExpressJS
*   **Database:** MySQL

---

## Today's Poll
Designed to capture and analyze the real-time opinions of our audience.

*   **Question Expiration:** The engine automatically checks the active poll timestamp every 24 hours.
*   **Deduplication:** Security logic prevents multiple participation or voting attempts within the active 24-hour cycle.

---

## Features/Pages
*   **Podcasts:** Dynamically fetches and plays uploaded podcast audio files sourced via the YouTube channel content workflow.
*   **Playlists:** Aggregates and organizes thematic podcast bundles sourced directly from YouTube feeds.
*   **YouTube:** Provides inline elements and direct user navigation to the official streaming channel.
*   **About:** A dedicated layout detailing the host’s professional background, history, and achievements.
*   **Booking:** Secure scheduling forms and contact endpoints for public speaking engagements and media appearances.

---

## Folder Structure

```text
liberty/
├── frontend/                   # React Client Application
│   ├── public/                 # Static assets
│   │   └── question.json       # 24-hour cache file for current poll state
│   └── src/                    # Source files
│       ├── components/         # Reusable UI elements (Buttons, Cards, Nav)
│       └── pages/              # Routed page-level components (Home, About, Polls)
└── server/                     # Express Backend Application
    ├── app.js                  # Application entry point & middleware configuration
    ├── .env                    # Environment variables (DB credentials, Ports)
    └── routes/                 # Express API route handlers
        ├── db.js               # Database connection pool setup & raw query wrappers
        ├── question.js         # Daily voting poll logic and file/DB sync
        ├── socialmedia.js      # YouTube API integrations and social links
        └── subscribe.js        # Newsletter and booking form handler
```

---

## Local Development

### Prerequisites
*   Node.js (v18+ recommended)
*   MySQL Server Instance
*   MySQL Workbench

### Setup Instructions

#### Frontend (Client-Side)
```bash
cd liberty
npm install
```

#### Backend (Server-Side)
```bash
cd server
npm install
npm run dev:all
```

---

## Environment Setup
Create a `.env` configuration file inside your `server/` directory with the following variables:

```env
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_specific_password

YOUTUBE_CHANNEL_URL=https://youtube.com
FACEBOOK_PAGE_URL=https://facebook.com
X_PAGE_URL=https://x.com
INSTAGRAM_PAGE_URL=https://instagram.com
WHATSAPP_ACCOUNT=https://whatsapp.com
TIKTOK_PAGE_URL=https://tiktok.com
GMAIL_ACCOUNT=your_email@example.com
```

---

## Database Schema

```sql
CREATE DATABASE IF NOT EXISTS db_poll;
USE db_poll;

CREATE TABLE IF NOT EXISTS poll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    questions VARCHAR(255) NULL, 
    answers VARCHAR(255) NULL, 
    votes INT DEFAULT 0, 
    date VARCHAR(255) NULL
);

CREATE INDEX idx_poll_questions_answers ON poll(questions, answers);
```

---

## Routes/Database

```javascript
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const mysql = require("mysql2");
const router = express.Router();

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "password@123",
  database: "db_poll",
};

const handleVoteInsertion = (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required" });
  }

  const con = mysql.createConnection(dbConfig);

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);
      return res.status(500).send("Database connection failed");
    }

    const sql = "INSERT INTO poll (questions, answers, votes, date) VALUES (?, ?, 1, ?)";
    const todayStr = new Date().toISOString().slice(0, 10);
    con.query(sql, [question, answer, todayStr], (err, result) => {
      con.end();

      if (err) {
        console.error("Failed to insert vote into MySQL:", err);
        return res.status(500).json({ error: "Failed to record vote" });
      }

      return res
        .status(201)
        .json({ message: "Vote recorded successfully!", id: result.insertId });
    });
  });
};

router.post("/", express.json(), handleVoteInsertion);
router.post("/db", express.json(), handleVoteInsertion);

router.get("/results", (req, res) => {
  const { question } = req.query;

  if (!question) {
    return res.status(400).json({ error: "Missing 'question' query parameter" });
  }

  const con = mysql.createConnection(dbConfig);

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);
      return res.status(500).send("Database connection failed");
    }

    const sql = `
      SELECT answers, COUNT(*) AS total_votes 
      FROM poll 
      WHERE questions = ? 
      GROUP BY answers
    `;

    con.query(sql, [question], (err, rows) => {
      con.end();

      if (err) {
        console.error("Failed to fetch aggregate poll analytics:", err);
        return res.status(500).json({ error: "Database analytics retrieval failed" });
      }

      const stats = {};
      rows.forEach((row) => {
        stats[row.answers] = row.total_votes;
      });

      return res.status(200).json({
        question: question,
        votes: stats,
      });
    });
  });
});

router.get("/db", (req, res) => {
  const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password@123",
  });

  con.connect((err) => {
    if (err) {
      console.error("Connection failed:", err);
      return res.status(500).send("Database connection failed");
    }

    console.log("Connected to MySQL Server!");

    con.query("CREATE DATABASE IF NOT EXISTS db_poll", (err) => {
      if (err) {
        con.end();
        console.error("Database creation failed:", err);
        return res.status(500).send("Database creation failed");
      }
      console.log("Database db_poll created or already exists.");

      con.changeUser({ database: "db_poll" }, (err) => {
        if (err) {
          con.end();
          console.error("Failed to switch database:", err);
          return res.status(500).send("Database selection failed");
        }

        const createTableSql = `CREATE TABLE IF NOT EXISTS poll (
          id INT AUTO_INCREMENT PRIMARY KEY,
          questions VARCHAR(255), 
          answers VARCHAR(255), 
          votes INT DEFAULT 0, 
          date VARCHAR(255)
        )`;

        con.query(createTableSql, (err, result) => {
          if (err) {
            con.end();
            console.error("Table creation failed:", err);
            return res.status(500).send("verification failed");
          }

          const checkColumnSql = `SHOW COLUMNS FROM poll LIKE 'id'`;

          con.query(checkColumnSql, (err, rows) => {
            if (err) {
              con.end();
              console.error("Failed to verify columns:", err);
              return res.status(500).send("verification failed");
            }

            if (rows.length === 0) {
              console.log("table version detected.");

              con.query("DROP TABLE poll", (err) => {
                if (err) {
                  con.end();
                  console.error("Failed to drop old table:", err);
                  return res.status(500).send("rebuild failed");
                }

                con.query(createTableSql, (err) => {
                  con.end();
                  if (err) {
                    console.error("Failed to recreate table:", err);
                    return res.status(500).send("Database failed");
                  }
                  console.log("table successful");
                  return res.send("successfully recreated a column!");
                });
              });
            } else {
              con.end();
              console.log("modification successfully.");
              return res.send("Database created successfully!");
            }
          });
        });
      });
    });
  });
});

module.exports = router;
```

---

### Questions/question.json
```json
{
  "activeQuestion": "Should corporate campaign contributions be completely banned in federal elections?",
  "options": ["Yes", "No"],
  "lastUpdated": "2026-08-22T20:15:00.000Z",
  "activeIpRegistry": []
}
```
