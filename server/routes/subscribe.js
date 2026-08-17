/* eslint-disable no-undef */
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// subscribe route
router.post("/subscribe", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).end();
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Subscription Confirmation",
    text: `Hello ${email}, thanks for subscribing!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    // handles error
    if (error) {
      console.error("Error:", error);

      // failed
      res.status(500).end();
    } else {
      console.log("Email sent:", info.response);

      // successful
      res.status(200).end();
    }
  });
});

module.exports = router;
