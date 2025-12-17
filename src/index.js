const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const express = require("express");
const app = express();
connectDB();
app.use(express.json());
app.use("/api/user", userRoutes);

app.listen(8000, () => {
  console.log(`App is running on port 8000`);
});
