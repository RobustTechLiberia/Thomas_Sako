const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.set("trust proxy", true);
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const isAllowed =
        origin.includes("localhost") ||
        origin.endsWith(".vercel.app") ||
        configuredOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: origin not allowed"));
      }
    },
    credentials: true,
  }),
);

app.use("/question", questionRouter);
app.use(SocialRouter);
app.use("/", subscribeRouter);
app.use("/", databaseRouter);

app.get("/home", (req, res) => {
  res.status(200).send("hello, world!");
});

// Keep API failures JSON so the frontend can present a useful message instead
// of Express's default HTML error response.
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  res.status(err.status || 500).json({
    error: "The service is temporarily unavailable. Please try again later.",
  });
});

// Vercel imports this app directly. Running the file locally starts the API
// server used by Vite's development proxy.
if (require.main === module) {
  const port = parseInt(process.env.PORT || "8080", 10);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
