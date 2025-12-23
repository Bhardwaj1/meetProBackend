const registerMeetingHandler = (io, socket) => {
  socket.on("join-meeting", ({ meetingId }) => {
    socket.join(meetingId);
    socket.meetingId=meetingId;
    io.to(meetingId).emit("user-joined", {
      user: socket.user,
    });
  });

  socket.on("leave-meeting", ({ meetingId }) => {
    socket.leave(meetingId);

    io.to(meetingId).emit("user-left", {
      userId: socket.user._id,
    });
  });
};

module.exports=registerMeetingHandler
