const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const registerMeetingHandler = require("./meeting");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log("Socket connected", socket);

    registerMeetingHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.user.name);
    });
  });

  return io;
};

module.exports = initSocket;
