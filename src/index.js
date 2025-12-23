require("dotenv").config();
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const cors = require("cors");
const swaggerSpec = require("./config/swagger");
const { Server } = require("socket.io");
const http = require("http");

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth.routes");
const meetingRoutes = require("./routes/meeting.routes");

const app = express();
const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected");
  socket.on("hello", (data) => {
    console.log("Message from client");
    socket.emit("hello-response", {
      message: "hello from server",
    });
  });

  // Join meeting room
  socket.on("join-meeting", (meetingId, userId) => {
    socket.join(meetingId);
    console.log(`User ${userId} joined meeting ${meetingId}`);
    socket.to(meetingId).emit("user-joined", {
      userId,
    });
  });

  // Leave meeting room
  socket.on("leave-meeting", (meetingId, userId) => {
    socket.leave(meetingId);
    console.log(`user ${userId} left the meeting ${meetingId}`);

    socket.to(meetingId).emit("user-left", {
      userId,
    });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);

server.listen(PORT || 8080, () => {
  console.log(`🚀 App + Socket running on port ${PORT}`);
});
