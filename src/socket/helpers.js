const Meeting = require("../models/Meeting");

const emitparticipantsCount = async (io, meetingId) => {
  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) {
    return;
  }

  const count = meeting.participants.length;

  io.to(meetingId).emit("participants-count", { count });
};

module.exports = emitparticipantsCount;
