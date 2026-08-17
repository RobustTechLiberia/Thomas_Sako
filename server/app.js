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
  "http://localhost:5173",
  "https://your-frontend-domain.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("no connection made"));
      }
    },
  }),
);

// JSON
app.use(express.json());

// serve react
app.use(express.static(path.join(__dirname, "client/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// default API route
app
  .get("/home", (req, res) => {
    res.send("hello, world!");
  })
  .listen(port, (err) => {
    if (!err) {
      console.log(`server is running on port ${port}`);
    } else {
      console.log(`server crash at ${port}`);
    }
  });
