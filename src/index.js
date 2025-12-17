require("dotenv").config();
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const express = require("express");
const app = express();

const PORT = process.env.PORT;

connectDB();
app.use(express.json());
app.use("/api/user", userRoutes);

app.listen(PORT || 8080, () => {
  console.log(`App is running on port ${PORT}`);
});
