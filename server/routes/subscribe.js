"use strict";

const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/subscribe", async (req, res) => {
  try {
    if (!req.body || typeof req.body.email !== "string") {
      return res.status(400).json({
        error: "Email field is required.",
      });
    }

    const cleanEmail = req.body.email.trim();

    if (
      !cleanEmail ||
      cleanEmail.length > 254 ||
      !emailPattern.test(cleanEmail)
    ) {
      return res.status(400).json({
        error: "Enter a valid email address.",
      });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("Subscription email credentials are missing.");

      return res.status(503).json({
        error: "The subscription service is temporarily unavailable.",
      });
    }

    const youtubeUrl =
      process.env.YOUTUBE_CHANNEL_URL || "https://www.youtube.com/";

    let parsedYoutubeUrl;

    try {
      parsedYoutubeUrl = new URL(youtubeUrl);
    } catch {
      return res.status(503).json({
        error: "The subscription service is incorrectly configured.",
      });
    }

    if (
      !["https:", "http:"].includes(parsedYoutubeUrl.protocol) ||
      !["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
        parsedYoutubeUrl.hostname.toLowerCase(),
      )
    ) {
      return res.status(503).json({
        error: "The YouTube channel URL is incorrectly configured.",
      });
    }

    const mailOptions = {
      from: {
        name: "1847 Liberty",
        address: emailUser,
      },
      to: cleanEmail,
      subject: "1847 Liberty - Thanks for subscribing!",
      text: [
        "Thanks for subscribing!",
        "",
        "Don't miss our live podcasts.",
        "We host live sessions covering the latest insights and trends.",
        "Follow our YouTube channel and turn on notifications.",
        parsedYoutubeUrl.toString(),
        "",
        "See you on the next stream,",
        "47liberty Team",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eeeeee; border-radius: 8px;">
          <h2 style="color: #333333;">Thanks for subscribing!</h2>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #cc0000;">Don't Miss Our Live Podcasts!</h3>
            <p style="font-size: 14px; color: #666666;">
              We host live sessions covering the latest insights and trends. Follow our YouTube channel and turn on notifications so you never miss a live stream.
            </p>
            <a href="${parsedYoutubeUrl.toString()}" style="background-color: #cc0000; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; margin-top: 10px;">
              Subscribe on YouTube
            </a>
          </div>

          <p style="font-size: 14px; color: #888888;">
            See you on the next stream,<br>
            <strong>47liberty Team</strong>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Subscription confirmation sent:", info.messageId);

    return res.status(200).json({
      message: "Subscription confirmed.",
    });
  } catch (error) {
    console.error("Subscription email delivery failed:", {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    if (error.code === "EAUTH") {
      return res.status(503).json({
        error: "Email service authentication failed. Please contact support.",
      });
    }

    if (error.code === "EENVELOPE" || error.code === "EMESSAGE") {
      return res.status(400).json({
        error: "The confirmation email could not be accepted for delivery.",
      });
    }

    return res.status(502).json({
      error: "Failed to send confirmation email. Please try again later.",
    });
  }
});

module.exports = router;
