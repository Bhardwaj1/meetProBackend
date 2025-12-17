const User = require("../models/User");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail");

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

const login = async (req, res) => {};

const verifyOtp = () => {};

module.exports = { register, login, verifyOtp };
