const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const registerMeetingHandler = require("./meeting");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    if (socket.user && socket.user._id) {
    socket.join(socket.user._id.toString());
    console.log(`✅ User ${socket.user._id} joined personal room`);
  }
  

    registerMeetingHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.user?.name);
    });
  });

  return io;
};

module.exports = initSocket;
