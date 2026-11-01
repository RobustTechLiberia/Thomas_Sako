"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const dotenv = require("dotenv");

function loadLocalEnvironment() {
  // Vercel supplies these values through its environment.  Locally, load the
  // untracked server/.env file before the route modules read their settings.
  // dotenv does not replace values already supplied by the host.
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

loadLocalEnvironment();

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
