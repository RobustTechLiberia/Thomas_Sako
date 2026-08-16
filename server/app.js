/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const port = 8080;
const app = express();
const subscribeRouter = require("./routes/subscribe");

// subscribe router
app.use("/", subscribeRouter);

// frontend endpoint
app.use(cors({ origin: "http://localhost:5173" }));

// default route
app
  .get("/home", (req, res) => {
    res.send("hello, world!");
  })
  .listen(port, (err) => {
    //   handles crash errors
    if (!err) {
      console.log(`server is running on port ${port}`);
    } else {
      console.log(`server crash at ${port}`);
    }
  });
