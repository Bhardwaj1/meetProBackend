const { v4: uuidV4 } = require("uuid");

const createMeeting = (req, res) => {
  const meetingId = uuidV4().slice(0, 6);
  res.status(201).json({
    success: true,
    message: "Meeting created successfully",
    meetingId,
  });
};

const joinMeeting = (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    res.status(400).json({
      success: false,
      message: "Meeting Id is required",
    });
  }

  res.status(200).json({
    success: true,
    message: "Joined meeting successfully",
    meetingId,
  });
};

module.exports = { createMeeting, joinMeeting };
