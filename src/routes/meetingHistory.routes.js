const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getMeetingsHistory,
} = require("../controllers/meetingHistory.controller");

router.get("/", protect, getMeetingsHistory);

module.exports = router;
