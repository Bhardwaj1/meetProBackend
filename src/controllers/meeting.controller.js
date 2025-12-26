const { v4: uuidV4 } = require("uuid");
const Meeting = require("../models/Meeting");
const asyncHandler = require("express-async-handler");

/* ================================
   CREATE MEETING
================================ */
const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.create({
    meetingId: uuidV4().slice(0, 6),
    host: req.user._id,
    participants: [
      {
        user: req.user._id,
        isMuted: false,
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Meeting created successfully",
    meetingId: meeting.meetingId,
    meetingLink: `http://localhost:8000/api/meeting/${meeting.meetingId}`,
  });
});

/* ================================
   JOIN MEETING
================================ */
const joinMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    return res.status(400).json({
      success: false,
      message: "Meeting Id is required",
    });
  }

  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: "Meeting not found",
    });
  }

  if (!meeting.isActive) {
    return res.status(400).json({
      success: false,
      message: "Meeting already ended",
    });
  }

  const alreadyJoined = meeting.participants.find(
    (p) => p.user.toString() === req.user._id.toString()
  );

  if (!alreadyJoined) {
    meeting.participants.push({
      user: req.user._id,
      isMuted: false,
    });
    await meeting.save();
  }

  res.status(200).json({
    success: true,
    message: "Meeting joined successfully",
    meetingId: meeting.meetingId,
  });
});

/* ================================
   GET MEETING DETAILS
================================ */
const getMeetingDetails = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ meetingId })
    .populate("host", "name email")
    .populate("participants.user", "name email");

  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  res.status(200).json({
    meetingId: meeting.meetingId,
    host: meeting.host,
    participants: meeting.participants.map((p) => ({
      id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      isMuted: p.isMuted,
    })),
    isActive: meeting.isActive,
  });
});

/* ================================
   LEAVE MEETING
================================ */
const leaveMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    res.status(400);
    throw new Error("Meeting Id is required");
  }

  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting || !meeting.isActive) {
    res.status(404);
    throw new Error("Meeting not found or already ended");
  }

  const userId = req.user._id.toString();

  const participantIndex = meeting.participants.findIndex(
    (p) => p.user.toString() === userId
  );

  if (participantIndex === -1) {
    res.status(404);
    throw new Error("You are not part of the meeting");
  }

  // 🔥 HOST LEAVES → END MEETING
  if (meeting.host.toString() === userId) {
    meeting.isActive = false;
    meeting.endAt = new Date();
    await meeting.save();

    return res.status(200).json({
      success: true,
      message: "Host left. Meeting ended",
    });
  }

  // 🙋 PARTICIPANT LEAVES
  meeting.participants.splice(participantIndex, 1);
  await meeting.save();

  res.status(200).json({
    success: true,
    message: "Meeting left successfully",
  });
});

/* ================================
   END MEETING (HOST ONLY)
================================ */
const endMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.body;

  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: "Meeting not found",
    });
  }

  if (meeting.host.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only host can end meeting",
    });
  }

  meeting.isActive = false;
  meeting.endAt = new Date();
  await meeting.save();

  res.status(200).json({
    success: true,
    message: "Meeting ended successfully",
  });
});

module.exports = {
  createMeeting,
  joinMeeting,
  getMeetingDetails,
  leaveMeeting,
  endMeeting,
};
