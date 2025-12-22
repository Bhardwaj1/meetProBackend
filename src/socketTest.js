const { io } = require("socket.io-client");

const socket = io("http://localhost:8000");

socket.on("connect", () => {
  console.log(`Connected to server ${socket?.id}`);

  socket.emit("hello", { name: "Gaurav" });
});

socket.on("hello-response", (data) => {
  console.log(`Server Says ${data.message}`);
});

socket.on("disconnect", (data) => {
  console.log("Disconnected");
});
