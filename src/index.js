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
const initSocket = require("./socket");

const app = express();
const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

initSocket(server);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);

server.listen(PORT || 8080, () => {
  console.log(`🚀 App + Socket running on port ${PORT}`);
});
