const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "1847 Liberty CMS API is available.",
  });
});

module.exports = router;
