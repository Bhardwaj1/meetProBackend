const { v4: uuidV4 } = require("uuid");
const Meeting = require("../models/Meeting");
const asyncHandler = require("express-async-handler");
const meetingService= require("../services/meeting.serivce");

/* ================================
   CREATE MEETING
================================ */
const createMeeting = asyncHandler(async (req, res) => {
  const meeting= await meetingService.createMeeting(req.user._id);

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

  const meeting = await meetingService.joinMeeting(meetingId,req.user._id);

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
  const result= await meetingService.leaveMeeting(meetingId,req.user._id);

  if (result.ended) {
    res.status(200).json({
      success:true,
      message:"Host left. Meeting ended"
    })
  };
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
 await meetingService.endMeeting(meetingId,req.user._id);
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
