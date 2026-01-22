const meetingService = require("../services/meeting.serivce");

const registerMeetingHandlers = (io, socket) => {
  /* ===============================
   JOIN MEETING (AFTER APPROVAL)
================================ */
  socket.on("join-meeting", async ({ meetingId }) => {
    try {
      const meeting = await meetingService.getActiveMeeting(meetingId);

      const isHost = meeting.host.toString() === socket.user._id.toString();

      const isParticipant = meeting.participants.some(
        (p) => p.user.toString() === socket.user._id.toString()
      );

      if (!isHost && !isParticipant) {
        socket.emit("join-denied", {
          reason: "WAITING APPROVAL",
        });
        return;
      };

      if (isHost) {
        meeting.hostSocketId=socket._id;
        await meeting.save();

        console.log(`Host ${socket.user._id} joined meeting ${meetingId}`);
      }

      socket.join(meetingId);
      socket.meetingId = meetingId;

      const snapshot = await meetingService.getMeetingSnapshot(meetingId);
      socket.emit("meeting-state", snapshot);
    } catch (err) {
      console.log("join-meeting error:", err.message);
      socket.emit("meeting-error", {
        message: err.message || "Unable to join meeting",
        code: "JOIN_FAILED",
      });
    }
  });

  /* ===============================
   HOST → APPROVE JOIN
================================ */
  socket.on("approve-join", async ({ meetingId, userId }) => {
    try {
      const waitingUser = await meetingService.approveJoinMeeting(
        meetingId,
        socket.user._id,
        userId
      );
      // Notify user approved
      io.to(userId.toString()).emit("join-approved", { meetingId });
      io.to(meetingId).emit("user-joined", {
        user: {
          id: userId,
          name: waitingUser.name,
        },
      });
    } catch (error) {
      console.log("approve-join error:", error.message);
      socket.emit("join-error", { message: error.message });
    }
  });
  /* ===============================
   REQUEST JOIN (WAITING ROOM)
================================ */

  socket.on("request-join", async ({ meetingId }) => {
    try {
      const meeting = await meetingService.requestJoinMeeting(
        meetingId,
        socket.user._id,
        socket.user.name
      );

      console.log(meetingId, socket.user._id, socket.user.name);

      // Notify Host only
      io.sockets.sockets.forEach((s) => {
        if (s.user?._id.toString() === meeting.host.toString()) {
          s.emit("join-requested", {
            userId: socket.user._id,
            name: socket.user.name,
            requestedAt: Date.now(),
          });
        }
      });

      socket.emit("waiting");
    } catch (error) {
      console.log("request-join error:", error.message);
      socket.emit("join-error", { message: error.message });
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

      const result = await meetingService.leaveMeeting(
        socket.meetingId,
        socket.user._id
      );

      if (result.ended) {
        io.to(socket.meetingId).emit("meeting-ended");
        const sockets = await io.in(socket.meetingId).fetchSockets();
        sockets.forEach((s) => {
          s.leave(socket.meetingId);
          s.meetingId = null;
        });
        return;
      }
      // Normal participant leave
      socket.leave(socket.meetingId);

      socket.to(socket.meetingId).emit("user-left", {
        userId: socket.user._id,
      });

      socket.meetingId = null;
    } catch (err) {
      console.log("leave-meeting error:", err.message);
    }
  });

  // socket.on("rejoin-meeting", async ({ meetingId }) => {
  //   try {
  //     const snapshot = await meetingService.getMeetingSnapshot(meetingId);
  //     if (!snapshot.isActive) {
  //       socket.emit("meeting-ended");
  //     }
  //     socket.join(meetingId);
  //     socket.meetingId = meetingId;
  //     socket.emit("meeting-state", snapshot);
  //     socket.to(meetingId).emit("user-reconnected", {
  //       userId: socket.user._id,
  //       name: socket.user.name,
  //     });
  //   } catch (error) {
  //     console.log("rejoin-meeting error:", err.message);
  //   }
  // });

  /* ===============================
   WEBRTC SIGNALING (AUDIO)
================================ */

  // OFFER
  socket.on("webrtc-offer", ({ offer, targetUserId }) => {
    io.sockets.sockets.forEach((s) => {
      if (s.user?._id.toString() === targetUserId.toString()) {
        s.emit("webrtc-offer", {
          offer,
          from: socket.user._id,
        });
      }
    });
  });

  // ANSWER
  socket.on("webrtc-answer", ({ answer, targetUserId }) => {
    io.sockets.sockets.forEach((s) => {
      if (s.user?._id.toString() === targetUserId.toString()) {
        s.emit("webrtc-answer", {
          answer,
          from: socket.user._id,
        });
      }
    });
  });

  // ICE CANDIDATE
  socket.on("webrtc-ice-candidate", ({ candidate, targetUserId }) => {
    io.sockets.sockets.forEach((s) => {
      if (s.user?._id.toString() === targetUserId.toString()) {
        s.emit("webrtc-ice-candidate", {
          candidate,
          from: socket?.user?._id,
        });
      }
    });
  });
};

module.exports = registerMeetingHandlers;
