const MeetingLog = require("../models/MeetingLog");

const logMeetingEvent = async ({ meetingId, action, actor, target = null }) => {
  try {
    await MeetingLog.create({
      meetingId,
      action,
      actor,
      target,
    });
  } catch (error) {
    console.log("Meeting Log error", error.message);
  }
};

module.exports = { logMeetingEvent };
