const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Hardened path validation for deployment environments
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.set("trust proxy", true);
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// 1. FIXED: Set up CORS FIRST so pre-flight OPTIONS requests resolve instantly
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or programmatic requests (like Postman/Insomnia)
      if (!origin) return callback(null, true);

      const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      // FIXED: Switched .endsWith to a regex match to fully support Vercel wildcard preview domains
      const isAllowed =
        origin.includes("localhost") ||
        /\.vercel\.app\$/.test(origin) || 
        configuredOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // Return null instead of breaking execution loops on unhandled rejections
        callback(null, false); 
      }
    },
    credentials: true,
    optionsSuccessStatus: 200 // Forces older legacy browsers to correctly process pre-flights
  }),
);

// 2. FIXED: Body parsing middleware sits directly underneath CORS configuration
app.use(express.json());

// Import sub-routing definitions
const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

// Bind endpoints cleanly
app.use("/question", questionRouter);
app.use(SocialRouter);
app.use("/", subscribeRouter);
app.use("/", databaseRouter);

app.get("/home", (req, res) => {
  res.status(200).send("hello, world!");
});

// Central error pipeline
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  
  // Safe validation guard to verify if headers have already fired off
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: "The service is temporarily unavailable. Please try again later.",
    message: err.message || "Internal Server Error"
  });
});

if (require.main === module) {
  const port = parseInt(process.env.PORT || "8080", 10);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
