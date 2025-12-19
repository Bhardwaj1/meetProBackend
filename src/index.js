require("dotenv").config();
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth.routes");
const express = require("express");
const cors = require("cors");
const swaggerSpec = require("./config/swagger");
const app = express();

const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT || 8080, () => {
  console.log(`App is running on port ${PORT}`);
});
