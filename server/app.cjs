"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const app = express();

app.set("trust proxy", 1);

const defaultAllowedOrigins = [
  // The production frontend is published through this repository's GitHub Pages site.
  "https://robusttechliberia.github.io",
];

const configuredOrigins = [
  ...defaultAllowedOrigins,
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
]
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.replace(/\/+$/, "");

  // Explicitly allow configured frontend origins.
  if (configuredOrigins.includes(normalizedOrigin)) {
    return true;
  }

  let parsedOrigin;

  try {
    parsedOrigin = new URL(normalizedOrigin);
  } catch {
    return false;
  }

  const hostname = parsedOrigin.hostname.toLowerCase();

  // Local development only.
  const isLocalhost =
    process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1");

  // Allow HTTPS Vercel deployment domains.
  const isVercel =
    parsedOrigin.protocol === "https:" &&
    (hostname === "vercel.app" || hostname.endsWith(".vercel.app"));

  return isLocalhost || isVercel;
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked CORS origin:", origin);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json({ limit: "10kb" }));

// Import routers.
const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const socialRouter = require("./routes/socialmedia");

// Register routes.
app.use("/question", questionRouter);
app.use(socialRouter);
app.use("/", subscribeRouter);
app.use("/", databaseRouter);

// Health check.
app.get("/home", (req, res) => {
  return res.status(200).send("hello, world!");
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is running.",
  });
});

// Handle unknown routes.
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "API endpoint not found.",
    path: req.originalUrl,
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", {
    message: err.message,
    status: err.status,
    path: req.originalUrl,
  });

  if (res.headersSent) {
    return next(err);
  }

  // CORS errors should not be reported as generic server failures.
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: "This website is not allowed to access the API.",
    });
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
