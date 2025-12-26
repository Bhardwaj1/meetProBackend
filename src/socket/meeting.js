const Meeting = require("../models/Meeting");
const emitparticipantsCount = require("./helpers");

const registerMeetingHandler = (io, socket) => {
  // Join meeting
  socket.on("join-meeting", async ({ meetingId }) => {
    socket.join(meetingId);
    socket.meetingId = meetingId;

    await emitparticipantsCount(io, meetingId);
    io.to(meetingId).emit("user-joined", {
      user: socket.user,
    });
  });

  // Leave meeting
  socket.on("leave-meeting", async ({ meetingId }) => {
    if (!socket.meetingId) {
      return;
    }

    socket.leave(socket.meetingId);

    io.to(socket.meetingId).emit("user-left", {
      userId: socket.user._id,
    });
    socket.meetingId = null;
  });

  // Disconnect meeting

  socket.on("disconnect", async () => {
    if (!socket.meetingId) {
      return;
    }
    const meeting = await Meeting.findOne({
      meetingId: socket.meetingId,
      isActive: true,
    });

    if (!meeting) {
      return;
    }

    if (meeting.host.toString() === socket.user._id.toString()) {
      meeting.isActive = false;
      meeting.endAt = new Date();
      await meeting.save();
      io.to(socket.meetingId).emit("meeting-ended", {
        message: "Host disconnected. Meeting ended",
      });
    } else {
      await emitparticipantsCount(io, socket.meetingId);

      io.to(socket.meetingId).emit("user-left", {
        userId: socket.user._id,
      });
    }
  });
};

module.exports = registerMeetingHandler;
