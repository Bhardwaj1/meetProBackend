require("dotenv").config();
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const cors = require("cors");
const swaggerSpec = require("./config/swagger");
const { Server } = require("socket.io");
const http = require("http");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth.routes");
const meetingRoutes = require("./routes/meeting.routes");
const meetingLogRoutes=require("./routes/meetingLog.routes");
const initSocket = require("./socket");

const app = express();
const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use(cookieParser());
// ✅ CORRECT CORS CONFIG
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("combined"));

const server = http.createServer(app);

initSocket(server);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);
app.use("/api/meeting-log",meetingLogRoutes)

server.listen(PORT || 8080, () => {
  console.log(`🚀 App + Socket running on port ${PORT}`);
});
