const { v4: uuidV4 } = require("uuid");
const Meeting = require("../models/Meeting");

const createMeeting = async (req, res) => {
  // const meetingId =uuidV4().slice(0, 6);

  try {
    const meeting = await Meeting.create({
      meetingId: uuidV4().slice(0, 6),
      hostId: req.user?._id,
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
    res.status(400).json({
      success: false,
      message: "Meeting Id is required",
    });
  }
  try {
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting || !meeting.isActive) {
      res
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

const endMeeting = async (req, res) => {
  const { meetingId } = req.body;
  console.log(req.body);
  try {
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    // console.log(meeting?.hostId.toString(), req);
    if (meeting?.hostId.toString() !== req.user._id.toString()) {
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

module.exports = { createMeeting, joinMeeting, endMeeting };
