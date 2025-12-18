const User = require("../models/User");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password != confirmPassword) {
    return res
      .status(400)
      .json({ error: "Password and confirm password didn't match" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    otp,
  });

  await user.save();
  await sendEmail(email, name, otp);

  res.json({ message: "Otp sent to email please verify it" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not exists" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ error: "Wrong Password" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json(token);
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp) {
    return res.status(400).json({ error: "Invalid Otp" });
  }

  user.isVerified = true;
  user.otp = null;
  await user.save();

  res.json({ message: "User verified successfully" });
};

module.exports = { register, login, verifyOtp };
