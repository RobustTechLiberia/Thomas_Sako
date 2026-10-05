const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
// Load the local server environment regardless of whether the command was run
// from the repository root or from /server. Vercel supplies these values from
// its dashboard and dotenv leaves existing values untouched.
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.set("trust proxy", true);
app.use(
  helmet({
    // This is a public JSON API, not a page-rendering server. Keeping the API
    // response policy explicit prevents a deployment-specific CSP from
    // interfering with the Vite application.
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

// Vercel imports this app directly. Running the file locally starts the API
// server used by Vite's development proxy.
if (require.main === module) {
  const port = parseInt(process.env.PORT || "8080", 10);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
