const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Subscription confirmation endpoint.
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (
    typeof email !== "string" ||
    !emailPattern.test(email.trim()) ||
    email.trim().length > 254
  ) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const cleanEmail = email.trim();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Subscription email is not configured.");
    return res.status(503).json({
      error: "The subscription service is temporarily unavailable.",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: cleanEmail,
    subject: "1847 Liberty",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eeeeee; border-radius: 8px;">
        <h2 style="color: #333333;">Thanks for subscribing!</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #cc0000;">Don't Miss Our Live Podcasts!</h3>
          <p style="font-size: 14px; color: #666666;">
            We host live sessions covering the latest insights and trends. Follow our YouTube channel and turn on notifications so you never miss a live stream.
          </p>
          <a href="${process.env.YOUTUBE_CHANNEL_URL}" style="background-color: #cc0000; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; margin-top: 10px;">
            Subscribe on YouTube
          </a>
        </div>

        <p style="font-size: 14px; color: #888888;">
          See you on the next stream,<br>
          <strong>The Thomas.com Team</strong>
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Subscription confirmation sent:", info.messageId);
    return res.status(200).json({ message: "Subscription confirmed." });
  } catch (error) {
    // Do not expose the mail provider's operational details to visitors.
    console.error("Subscription email delivery failed:", error);
    return res.status(502).json({
      error: "We could not send the confirmation email. Please try again.",
    });
  }
});

module.exports = router;
