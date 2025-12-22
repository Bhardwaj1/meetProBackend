const { v4: uuidV4 } = require("uuid");
const Meeting = require("../models/Meeting");
const asyncHandler = require("express-async-handler");

const createMeeting = async (req, res) => {
  // const meetingId =uuidV4().slice(0, 6);

  try {
    const meeting = await Meeting.create({
      meetingId: uuidV4().slice(0, 6),
      host: req.user?._id,
      participants: [req.user?._id],
    });
    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meetingId: meeting?.meetingId,
      meetingLink: `http://localhost:8000/api/meeting/${meeting?.meetingId}`,
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message,
      success: false,
      message: "Internal Server Error",
    });
  }
};

const joinMeeting = async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    return res.status(400).json({
      success: false,
      message: "Meeting Id is required",
    });
  }
  try {
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting || !meeting.isActive) {
      return res
        .status(404)
        .json({ sucess: false, message: "meeting not found or inactive" });
    }

    if (!meeting.participants.includes(req.user._id)) {
      meeting.participants.push(req.user._id);
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      message: "Meeting joined successfully",
      meetingId: meeting?.meetingId,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getMeetingDetails = asyncHandler(async (req, res) => {
  const meetingId = req.params.meetingId;

  // Find meeting and host +particpants populate
  const meeting = await Meeting.findOne({ meetingId })
    .populate("host", "name email")
    .populate("participants", "name email");

  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  res.status(200).json({
    meetingId: meeting.meetingId,
    host: meeting.host,
    participants: meeting.participants,
    isActive: meeting.isActive,
  });
});

const leaveMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    res.status(400);
    throw new Error("Meeting Id is required");
  }

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting || !meeting.isActive) {
    res.status(404);
    throw new Error("Meeting not found or ended");
  }

  const userId = req.user._id.toString();

  // check user is participants or not

  // const isParticipants = meeting.participants
  //   .map((id) => id.toString())
  //   .includes(userId);

  const isParticipants = meeting.participants.find(
    (id) => id.toString() === userId
  );

  if (!isParticipants) {
    res.status(404);
    throw new Error("You are not the part of meeting");
  }

  if (meeting.host.toString() === userId) {
    meeting.isActive = false;
    (meeting.endAt = new Date.now()), await meeting.save();

    return res.status(200).json({
      success: true,
      message: "Meeting ended",
    });
  }
  meeting.participants = meeting.participants.filter(
    (id) => id.toString() !== userId
  );

  await meeting.save();

  res.status(200).json({
    success: true,
    message: "Meeting left successfully",
  });
});

const endMeeting = async (req, res) => {
  const { meetingId } = req.body;
  try {
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    if (meeting?.host.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Only host can end meeting" });
    }
    meeting.isActive = false;

    await meeting.save();

    res
      .status(200)
      .json({ success: true, message: "Meeting ended successfully" });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createMeeting,
  joinMeeting,
  endMeeting,
  getMeetingDetails,
  leaveMeeting,
};
