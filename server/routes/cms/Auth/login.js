const express = require("express");
const router = express.Router();

router.get("/cms/login", (req, res) => {
  res.send("cms login");
});

module.exports = router;
