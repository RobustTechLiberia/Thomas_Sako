const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

app.set("trust proxy", true);
app.use(helmet());

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed =
        origin.includes("localhost") || origin.endsWith(".vercel.app");

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

module.exports = app;
