/* eslint-disable no-undef */
// environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const port = 8080;
const app = express();

// external routers
const subscribeRouter = require("./routes/subscribe");
const databaseRouter = require("./routes/db");
const questionRouter = require("./routes/question");

//question router mounted
app.use("/question", questionRouter);

app.use(express.json());

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

app.get("/home", (req, res) => {
  res.send("hello, world!");
});

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/", (req, res, next) => {
  if (
    req.path.startsWith("/db") ||
    req.path.startsWith("/subscribe") ||
    req.path.startsWith("/home") ||
    req.path.startsWith("/results")
  ) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../client/dist/index.html"), (err) => {
    if (err) {
      res.status(404).json({
        error: "Client build files not compiled yet. Run npm run build.",
      });
    }
  });
});

app.listen(port, (err) => {
  if (!err) {
    console.log(`server is running on port ${port}`);
  } else {
    console.log(`server crash at ${port}`);
  }
});
