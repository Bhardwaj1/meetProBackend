const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getMeetingsHistory,
  exportMeeting
} = require("../controllers/meetingHistory.controller");

router.get("/", protect, getMeetingsHistory);
router.get('/export',protect,exportMeeting);

module.exports = router;
