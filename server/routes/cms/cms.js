const express = require("express");
const router = express.Router();

router.get("/cms", (req, res) => {
  res.send("1847 liberty show CMS");
});

module.exports = router;
