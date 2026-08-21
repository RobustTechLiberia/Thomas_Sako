/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
require("dotenv").config();

router.get("/api/socialmedia", (req, res) => {
  try {
    res.json({
      youtube: process.env.YOUTUBE_CHANNEL_URL || "",
      facebook: process.env.FACEBOOK_PAGE_URL || "",
      x: process.env.X_PAGE_URL || "",
      instagram: process.env.INSTAGRAM_PAGE_URL || "",
      whatsapp: process.env.WHATSAPP_ACCOUNT || "",
      tiktok: process.env.TIKTOK_PAGE_URL || "",
      gmail: process.env.GMAIL_ACCOUNT || "",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching social links", error: error.message });
  }
});

module.exports = router;
