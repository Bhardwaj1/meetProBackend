require("dotenv").config();
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const cors = require("cors");
const swaggerSpec = require("./config/swagger");

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth.routes");
const meetingRoutes = require("./routes/meeting.routes");

const app = express();
const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/meeting", meetingRoutes);

app.listen(PORT || 8080, () => {
  console.log(`App is running on port ${PORT}`);
});
