const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createMeeting,
  joinMeeting,
  endMeeting,
  getMeetingDetails,
  leaveMeeting,
} = require("../controllers/meeting.controller");

const router = express.Router();
/**
 * @swagger
 * /api/meeting/create-meeting:
 *   post:
 *     summary: Create a meeting
 *     tags:
 *       - Meeting
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Meeting created successfully
 */
router.post("/create-meeting", protect, createMeeting);

/**
 * @swagger
 * /api/meeting/join-meeting:
 *   get:
 *     summary: Join a meeting
 *     tags:
 *       - Meeting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Successfully joined meeting
 */
router.post("/join-meeting", protect, joinMeeting);

router.get("/:meetingId", protect, getMeetingDetails);
router.post("/leave-meeting", protect, leaveMeeting);
router.post("/end-meeting", protect, endMeeting);

module.exports = router;
