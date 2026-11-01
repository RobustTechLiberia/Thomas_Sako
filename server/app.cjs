"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.resolve(__dirname, "liberty-510919-a2f801783f8d.json");

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

    process.env.GOOGLE_PROJECT_ID = (process.env.GOOGLE_PROJECT_ID || serviceAccount.project_id || "").trim();
    process.env.GOOGLE_CLIENT_EMAIL = (process.env.GOOGLE_CLIENT_EMAIL || serviceAccount.client_email || "").trim();
    process.env.GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || serviceAccount.client_id || "").trim();
    process.env.GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || serviceAccount.private_key || "").trim();
    process.env.GOOGLE_TOKEN_URI = (process.env.GOOGLE_TOKEN_URI || serviceAccount.token_uri || "https://oauth2.googleapis.com/token").trim();
  } catch (error) {
    console.warn("Failed to load Google service account JSON. Falling back to environment variables.", error.message);
  }
}

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: true,
    credentials: false,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const socialRouter = require("./routes/socialmedia");

app.use("/question", questionRouter);
app.use(socialRouter);
app.use("/", subscribeRouter);
app.use("/", databaseRouter);

app.get("/home", (req, res) => {
  return res.status(200).send("");
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is running.",
  });
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "API endpoint not found.",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled API error:", {
    message: err.message,
    status: err.status,
    path: req.originalUrl,
  });

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON request body.",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error:
      err.status && err.status < 500
        ? err.message
        : "The service is temporarily unavailable. Please try again later.",
  });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || "8080", 10);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
