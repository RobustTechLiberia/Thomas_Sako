# Documentation


## Overview

This project is a multi-page portfolio clone of the official website for U.S. podcast host Michael Smerconish. The platform aggregates high-profile guest interviews, podcasts, playlists, and video content. It includes a custom time-locked polling engine and an advertisement management system.


## Architecture

* Frontend: ReactJS, TailwindCSS, React Router
* Backend: NodeJS, ExpressJS
* Database: MySQL

## Today's Poll
Meant to have the view of our audiences

* Question Expiration: checks the  timestamp every 24 hours.
* Deduplication: prevents multiple participation attempts within the active 24-hours.

## Features/Pages

* Podcasts: fetch uploaded podcasts from YouTube channel
* Playlists: fetch uploaded podcasts from YouTube channel
* YouTube: redirect to official channel
* About: detailing host's background and achievements.
* Booking: Contact and scheduling  for speaking engagements and media appearances

## Folder Structure


## Folder Structure

```
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



## Local Development
### Prerequisites

* Node.js (v18+ recommended)
* MySQL Server Instance
* MySQL Workbench

## Setup Instructions

### Frontend (Client-Side)

```
cd liberty
npm install
```

### Backend (Server-Side)

```
cd server
npm install
npm run dev:all

```

## Environment Setup

```
```
EMAIL_USER= enter your email address

EMAIL_PASS= enter your app password

YOUTUBE_CHANNEL_URL= youtube link
FACEBOOK_PAGE_URL= facebook link
X_PAGE_URL= twitter link
INSTAGRAM_PAGE_URL= instagram link
WHATSAPP_ACCOUNT= whatsapp channel link
TIKTOK_PAGE_URL= tiktok account
GMAIL_ACCOUNT= enter your email address

```

## Data Base Schema

```
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


### Routes/Database

```
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

    const sql =
      "INSERT INTO poll (questions, answers, votes, date) VALUES (?, ?, 1, ?)";
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
    return res
      .status(400)
      .json({ error: "Missing 'question' query parameter" });
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
        return res
          .status(500)
          .json({ error: "Database analytics retrieval failed" });
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


#### Questions/question.json

```
[
  {
    "id": 1,
    "question": "What is the current state of our nation's economy?",
    "options": ["Good", "Bad"]
  },
  {
    "id": 2,
    "question": "Do you support renewable energy initiatives?",
    "options": ["Yes", "No"]
  },
  {
    "id": 3,
    "question": "Should education be free for all?",
    "options": ["Agree", "Disagree"]
  }
]

```
