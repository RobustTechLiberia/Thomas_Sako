/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const path = require("path");
const port = 8080;
const app = express();
const subscribeRouter = require("./routes/subscribe");

// subscribe router
app.use("/", subscribeRouter);

// frontend endpoint
const allowedOrigins = [
  // local endpoint
  "http://localhost:5173",
  // production endpoint
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

// JSON body parser
app.use(express.json());

app.use(express.static(path.join(__dirname, "../client/dist")));

// default API route
app.get("/home", (req, res) => {
  res.send("hello, world!");
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// start server
app.listen(port, (err) => {
  if (!err) {
    console.log(`server is running on port ${port}`);
  } else {
    console.log(`server crash at ${port}`);
  }
});
