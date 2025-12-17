const express = require("express");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const app = express();

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Node.js application is working fine");
});
app.post("/user", async (req, res) => {
  try {
    const { email, name } = req.body;
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    let user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/user", async (req, res) => {
  let users = await User.find();
  res.status(200).json(users);
});

app.listen(8000);
