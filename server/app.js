import express from "express";
import dotenv from "dotenv";
import SocialMediaRouter from "./routes/socialmedia.js";
import SubscribeRouter from "./routes/subscribe.js";
import QuestionRouter from "./routes/question.js";
import PollRouter from "./routes/polls.js";
dotenv.config();

app.use("/", SocialMediaRouter);
app.use("/", SubscribeRouter);
app.use("/", QuestionRouter);
app.use("/", PollRouter);

const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.send("hello, world");
});

const server = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err) {
    console.error(`Server crash at localhost:${PORT}:`, err.message);
  }
});
