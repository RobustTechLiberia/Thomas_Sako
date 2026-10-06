"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

app.set("trust proxy", true);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const isAllowed =
        origin.includes("localhost") ||
        /\.vercel\.app$/.test(origin) ||
        configuredOrigins.includes(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

app.use("/question", questionRouter);

app.use(SocialRouter);

app.use("/", subscribeRouter);

app.use("/", databaseRouter);

app.get("/home", (req, res) => {
  return res.status(200).send("hello, world!");
});

app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    error: "The service is temporarily unavailable. Please try again later.",
    message: err.message || "Internal Server Error",
  });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || "8080", 10);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Database host: ${process.env.DB_HOST || "not configured"}`);
    console.log(`Database port: ${process.env.DB_PORT || "not configured"}`);
  });
}

module.exports = app;
