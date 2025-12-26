const Meeting = require("../models/Meeting");

const registerMeetingHandlers = (io, socket) => {
  /* ===============================
     JOIN MEETING
  ================================ */
  socket.on("join-meeting", async ({ meetingId }) => {
    const meeting = await Meeting.findOne({ meetingId })
      .populate("participants.user", "name email");

    if (!meeting || !meeting.isActive) return;

    socket.join(meetingId);
    socket.meetingId = meetingId;

    // 🔄 SEND FULL STATE TO JOINING USER
    socket.emit("meeting-state", {
      participants: meeting.participants.map((p) => ({
        id: p.user._id,
        name: p.user.name,
        isMuted: p.isMuted,
      })),
    });

    // 🔔 NOTIFY OTHERS
    socket.to(meetingId).emit("user-joined", {
      user: {
        id: socket.user._id,
        name: socket.user.name,
      },
    });
  });

  /* ===============================
     MUTE SELF
  ================================ */
  socket.on("mute-self", async () => {
    if (!socket.meetingId) return;

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });
    if (!meeting) return;

    const participant = meeting.participants.find(
      (p) => p.user.toString() === socket.user._id.toString()
    );

    if (!participant) return;

    participant.isMuted = true;
    await meeting.save();

    socket.to(socket.meetingId).emit("user-muted", {
      userId: socket.user._id,
    });
  });

  /* ===============================
     UNMUTE SELF
  ================================ */
  socket.on("unmute-self", async () => {
    if (!socket.meetingId) return;

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });
    if (!meeting) return;

    const participant = meeting.participants.find(
      (p) => p.user.toString() === socket.user._id.toString()
    );

    if (!participant) return;

    participant.isMuted = false;
    await meeting.save();

    socket.to(socket.meetingId).emit("user-unmuted", {
      userId: socket.user._id,
    });
  });

  /* ===============================
     LEAVE MEETING
  ================================ */
  socket.on("leave-meeting", async () => {
    if (!socket.meetingId) return;

    socket.leave(socket.meetingId);

    socket.to(socket.meetingId).emit("user-left", {
      userId: socket.user._id,
    });

    socket.meetingId = null;
  });
};

module.exports = registerMeetingHandlers;
