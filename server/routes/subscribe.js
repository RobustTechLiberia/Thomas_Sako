/* eslint-disable no-undef */
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// subscribe route
router.get("/subscribe", (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: "recipient@example.com",
    subject: "Test Email",
    text: "Hello from Nodemailer!",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error:", error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent:", info.response);
      res.send("Subscription email sent successfully!");
    }
  });
});

module.exports = router;
