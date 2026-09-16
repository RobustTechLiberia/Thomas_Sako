/* eslint-disable no-undef */
// environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

// express json middleware
app.use(express.json());

// question router mounted
app.use("/question", questionRouter);

// social media router
app.use(SocialRouter);

// external endpoints
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend-domain.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: origin not allowed"));
      }
    },
  }),
);

app.use("/", subscribeRouter);
app.use("/", databaseRouter);

// default route
app.get("/home", (req, res) => {
  res.send("hello, world!");
});

// export as module

module.exports = app;
