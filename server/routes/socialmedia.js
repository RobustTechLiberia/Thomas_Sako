/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

// social media endpoints
router.get("/api/socialmedia", (req, res) => {
  try {
    const socialLinks = {
      youtube: process.env.YOUTUBE_CHANNEL_URL || "",
      facebook: process.env.FACEBOOK_PAGE_URL || "",
      x: process.env.X_PAGE_URL || "",
      instagram: process.env.INSTAGRAM_PAGE_URL || "",
      whatsapp: process.env.WHATSAPP_ACCOUNT || "",
      tiktok: process.env.TIKTOK_PAGE_URL || "",
      gmail: process.env.GMAIL_ACCOUNT || "",
    };

    return res.status(200).json(socialLinks);
  } catch (error) {
    console.error("Error serving social media configurations:", error);
    return res.status(500).json({ error: "Failed to load social media links." });
  }
});

module.exports = router;