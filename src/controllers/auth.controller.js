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
    otpExipreAt: Date.now() + 60 * 1000,
  });

  await user.save();
  await sendEmail(email, name, otp);

  res
    .status(201)
    .json({ success: true, message: "Otp sent to email please verify it" });
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

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, //True in prouction
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login Succesfully",
    accessToken,
    user: {
      id: user?._id,
      name: user.email,
      email: user.email,
    },
  });
};

const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "No Refresh Token" });
    }

    const user = await User.findOne({ refreshToken: oldRefreshToken });

    if (!user) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Refresh Token Revoked" });
    }

    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.id.toString() !== user._id.toString()) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Token User Mismatch" });
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, //True in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp) {
    return res.status(400).json({ error: "Invalid Otp" });
  }

  if (user.otpExipreAt < Date.now()) {
    return res.status(400).json({ error: "OTP expired" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExipreAt = null;
  await user.save();

  res.json({ sucess: true, message: "User verified successfully" });
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ error: "User is already verified" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  user.otp = otp;
  user.otpExipreAt = Date.now() + 60 * 1000;

  await user.save();
  await sendEmail(email, user.name, otp);
  res.status(201).json({ message: "Otp Sent Successfully" });
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookie.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate(
        {
          refreshToken,
        },
        {
          refreshToken: null,
        }
      );
    }
    res.clearCookie("refreshToken");
    res.json({ message: "Logout Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout Failed", error: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  refreshToken,
  logout,
};
