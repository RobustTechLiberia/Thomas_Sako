"use strict";

const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const youtubeUrl =
  process.env.YOUTUBE_CHANNEL_URL || "https://www.youtube.com/";

function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

router.post("/subscribe", async (req, res) => {
  try {
    // Validate request body
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please enter your email address.",
      });
    }

    if (email.length > 254 || !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    // Validate SMTP configuration
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("Email credentials are not configured.");

      return res.status(503).json({
        success: false,
        error: "Email service is temporarily unavailable.",
      });
    }

    // Validate YouTube URL
    let parsedYoutubeUrl;

    try {
      parsedYoutubeUrl = new URL(youtubeUrl);
    } catch {
      return res.status(503).json({
        success: false,
        error: "The YouTube channel URL is invalid.",
      });
    }

    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
    ];

    if (
      parsedYoutubeUrl.protocol !== "https:" ||
      !allowedHosts.includes(parsedYoutubeUrl.hostname.toLowerCase())
    ) {
      return res.status(503).json({
        success: false,
        error: "The YouTube channel URL is invalid.",
      });
    }

    const transporter = createTransporter();

    const safeYoutubeUrl = parsedYoutubeUrl.toString();

    const mailOptions = {
      from: {
        name: "1847 Liberty",
        address: emailUser,
      },
      to: email,
      subject: "1847 Liberty - Thanks for subscribing!",
      text: [
        "Thanks for subscribing!",
        "",
        "Don't miss our live podcasts.",
        "We host live sessions covering the latest insights and trends.",
        "Follow our YouTube channel and turn on notifications.",
        safeYoutubeUrl,
        "",
        "See you on the next stream,",
        "47liberty Team",
      ].join("\n"),
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="
              max-width: 600px;
              margin: 20px auto;
              padding: 24px;
              border: 1px solid #eee;
              border-radius: 8px;
            ">
              <h2>Thanks for subscribing!</h2>

              <div style="
                background: #f9f9f9;
                padding: 20px;
                border-radius: 6px;
                text-align: center;
              ">
                <h3 style="color: #cc0000;">
                  Don't Miss Our Live Podcasts!
                </h3>

                <p style="font-size: 14px; line-height: 1.6;">
                  We host live sessions covering the latest
                  insights and trends. Follow our YouTube
                  channel and turn on notifications so you
                  never miss a live stream.
                </p>

                <a
                  href="${safeYoutubeUrl}"
                  style="
                    display: inline-block;
                    background: #cc0000;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 4px;
                  "
                >
                  Subscribe on YouTube
                </a>
              </div>

              <p style="font-size: 14px; color: #888; margin-top: 24px;">
                See you on the next stream,<br />
                <strong>47liberty Team</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Subscription email sent:", {
      messageId: info.messageId,
      recipient: email,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription confirmed! Please check your inbox.",
    });
  } catch (error) {
    // Log diagnostic information on the server only
    console.error("Subscription delivery failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    if (error.code === "EAUTH") {
      return res.status(503).json({
        success: false,
        error: "Email service authentication failed. Please contact support.",
      });
    }

    if (error.code === "EENVELOPE" || error.code === "EMESSAGE") {
      return res.status(400).json({
        success: false,
        error: "The confirmation email could not be accepted for delivery.",
      });
    }

    return res.status(502).json({
      success: false,
      error: "Unable to send your confirmation email. Please try again later.",
    });
  }
});

module.exports = router;
