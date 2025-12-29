const Meeting = require("../models/Meeting");

const registerMeetingHandlers = (io, socket) => {
  /* ===============================
     JOIN MEETING
  ================================ */
  socket.on("join-meeting", async ({ meetingId }) => {
    const meeting = await Meeting.findOne({ meetingId }).populate(
      "participants.user",
      "name email"
    );

    if (!meeting || !meeting.isActive) return;

    socket.join(meetingId);
    socket.meetingId = meetingId;

    socket.emit("meeting-state", {
      participants: meeting.participants.map((p) => ({
        id: p.user._id,
        name: p.user.name,
        isMuted: p.isMuted,
      })),
    });

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

    io.to(socket.meetingId).emit("user-muted", {
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

    io.to(socket.meetingId).emit("user-unmuted", {
      userId: socket.user._id,
    });
  });

  /* ===============================
     HOST → MUTE USER
  ================================ */
  socket.on("host-mute-user", async ({ targetUserId }) => {
    if (!socket.meetingId) return;

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });
    if (!meeting) return;

    if (meeting.host.toString() !== socket.user._id.toString()) return;

    const participant = meeting.participants.find(
      (p) => p.user.toString() === targetUserId
    );

    if (!participant) return;

    participant.isMuted = true;
    await meeting.save();

    io.to(socket.meetingId).emit("user-muted", {
      userId: targetUserId,
    });
  });

  /* ===============================
     HOST → UNMUTE USER
  ================================ */
  socket.on("host-unmute-user", async ({ targetUserId }) => {
    if (!socket.meetingId) return;

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });
    if (!meeting) return;

    if (meeting.host.toString() !== socket.user._id.toString()) return;

    const participant = meeting.participants.find(
      (p) => p.user.toString() === targetUserId
    );

    if (!participant) return;

    participant.isMuted = false;
    await meeting.save();

    io.to(socket.meetingId).emit("user-unmuted", {
      userId: targetUserId,
    });
  });

  socket.on("host-kick-user", async ({ targetUserId }) => {
    if (!socket.meetingId) {
      return;
    }

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });
    if (!meeting) {
      return;
    }

    if (meeting.host.toString() != socket.user._id.toString()) return;

    meeting.participants = meeting.participants.filter(
      (p) => p.user.toString() != targetUserId
    );

    await meeting.save();

    const targetSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user?._id.toString() === targetUserId
    );

    if (targetSocket) {
      targetSocket.leave(socket.meetingId);

      targetSocket.emit("user-kicked", {
        reason: "You were removed by host",
      });
    }

    socket.to(socket.meetingId).emit("user-left", {
      userId: targetUserId,
    });
  });

  // End Meeting

  socket.on("host-end-meeting", async () => {
    if (!socket.meetingId) {
      return;
    }

    const meeting = await Meeting.findOne({ meetingId: socket.meetingId });

    if (!meeting) return;

    if (meeting.host.toString() !== socket.user._id.toString()) {
      return;
    };

    meeting.isActive=false;
    meeting.endAt=new Date;

    await meeting.save();

    io.to(socket.meetingId).emit('meeting-ended');

    const roomSockets= await io.in(socket.meetingId).fetchSocket();

    roomSockets.forEach((s)=>{
      s.leave(socket.meetingId);
      s.meetingId=null;
    })
  });

  /* ===============================
     LEAVE MEETING
  ================================ */
  socket.on("leave-meeting", () => {
    if (!socket.meetingId) return;

    socket.leave(socket.meetingId);

    socket.to(socket.meetingId).emit("user-left", {
      userId: socket.user._id,
    });

    socket.meetingId = null;
  });
};

module.exports = registerMeetingHandlers;
