/* eslint-disable no-undef */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");
const SocialRouter = require("./routes/socialmedia");

// Body parser middleware
app.use(express.json());

// Dynamic CORS configuration for Vercel deployment
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      // Allow local development and vercel app domain automatically
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

// Mount routers
app.use("/question", questionRouter);
app.use(SocialRouter);
app.use("/", subscribeRouter);
app.use("/", databaseRouter);

// Default route
app.get("/home", (req, res) => {
  res.status(200).send("hello, world!");
});

// Export handler for Vercel Serverless Function
module.exports = app;
