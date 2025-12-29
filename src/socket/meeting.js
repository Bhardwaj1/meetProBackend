const meetingService = require("../services/meeting.serivce");

const registerMeetingHandlers = (io, socket) => {
  /* ===============================
     JOIN MEETING
  ================================ */
  socket.on("join-meeting", async ({ meetingId }) => {
    try {
      const meeting = await meetingService.joinMeeting(
        meetingId,
        socket.user._id
      );

      socket.join(meetingId);
      socket.meetingId = meetingId;

      socket.emit("meeting-state", {
        participants: meeting.participants.map((p) => ({
          id: p.user,
          isMuted: p.isMuted,
        })),
      });

      socket.to(meetingId).emit("user-joined", {
        user: {
          id: socket.user._id,
          name: socket.user.name,
        },
      });
    } catch (err) {
      console.log("join-meeting error:", err.message);
    }
  });

  /* ===============================
     MUTE SELF
  ================================ */
  socket.on("mute-self", async () => {
    try {
      if (!socket.meetingId) return;

      await meetingService.setMuteState(
        socket.meetingId,
        socket.user._id,
        true
      );

      io.to(socket.meetingId).emit("user-muted", {
        userId: socket.user._id,
      });
    } catch (err) {
      console.log("mute-self error:", err.message);
    }
  });

  /* ===============================
     UNMUTE SELF
  ================================ */
  socket.on("unmute-self", async () => {
    try {
      if (!socket.meetingId) return;

      await meetingService.setMuteState(
        socket.meetingId,
        socket.user._id,
        false
      );

      io.to(socket.meetingId).emit("user-unmuted", {
        userId: socket.user._id,
      });
    } catch (err) {
      console.log("unmute-self error:", err.message);
    }
  });

  /* ===============================
     HOST → MUTE USER
  ================================ */
  socket.on("host-mute-user", async ({ targetUserId }) => {
    try {
      if (!socket.meetingId) return;

      await meetingService.hostSetMuteState(
        socket.meetingId,
        socket.user._id,
        targetUserId,
        true
      );

      io.to(socket.meetingId).emit("user-muted", {
        userId: targetUserId,
      });
    } catch (err) {
      console.log("host-mute-user error:", err.message);
    }
  });

  /* ===============================
     HOST → UNMUTE USER
  ================================ */
  socket.on("host-unmute-user", async ({ targetUserId }) => {
    try {
      if (!socket.meetingId) return;

      await meetingService.hostSetMuteState(
        socket.meetingId,
        socket.user._id,
        targetUserId,
        false
      );

      io.to(socket.meetingId).emit("user-unmuted", {
        userId: targetUserId,
      });
    } catch (err) {
      console.log("host-unmute-user error:", err.message);
    }
  });

  /* ===============================
     HOST → KICK USER
  ================================ */
  socket.on("host-kick-user", async ({ targetUserId }) => {
    try {
      if (!socket.meetingId) return;

      await meetingService.kickUser(
        socket.meetingId,
        socket.user._id,
        targetUserId
      );

      io.to(socket.meetingId).emit("user-kicked", {
        userId: targetUserId,
      });

      // remove kicked user's socket from room
      io.sockets.sockets.forEach((s) => {
        if (s.user?._id.toString() === targetUserId.toString()) {
          s.leave(socket.meetingId);
          s.meetingId = null;
        }
      });
    } catch (err) {
      console.log("host-kick-user error:", err.message);
    }
  });

  /* ===============================
     HOST → END MEETING
  ================================ */
  socket.on("host-end-meeting", async () => {
    try {
      if (!socket.meetingId) return;

      await meetingService.endMeeting(socket.meetingId, socket.user._id);

      io.to(socket.meetingId).emit("meeting-ended");

      const roomSockets = await io.in(socket.meetingId).fetchSockets();
      roomSockets.forEach((s) => {
        s.leave(socket.meetingId);
        s.meetingId = null;
      });
    } catch (err) {
      console.log("host-end-meeting error:", err.message);
    }
  });

  /* ===============================
     LEAVE MEETING
  ================================ */
  socket.on("leave-meeting", async () => {
    try {
      if (!socket.meetingId) return;

      await meetingService.leaveMeeting(socket.meetingId, socket.user._id);

      socket.leave(socket.meetingId);

      socket.to(socket.meetingId).emit("user-left", {
        userId: socket.user._id,
      });

      socket.meetingId = null;
    } catch (err) {
      console.log("leave-meeting error:", err.message);
    }
  });

  socket.on("rejoin-meeting", async ({ meetingId }) => {
    try {
      const snapshot = await meetingService.getMeetingSnapshot(meetingId);
      if (!snapshot.isActive) {
        socket.emit("meeting-ended");
      }
      socket.join(meetingId);
      socket.meetingId = meetingId;
      socket.emit("meeting-state", snapshot);
      socket.to(meetingId).emit("user-reconnected", {
        userId: socket.user._id,
        name: socket.user.name,
      });
    } catch (error) {
      console.log("rejoin-meeting error:", err.message);
    }
  });
};

module.exports = registerMeetingHandlers;
