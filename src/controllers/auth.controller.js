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

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.status(200).json({
    success: true,
    message: "Login Succesfully",
    token,
    user: {
      id: user?._id,
      name: user.email,
      email: user.email,
    },
  });
};


const refreshToken=async(req,res)=>{
  try {
    const refreshToken=req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({message:"No Refresh Token"});
    }

    const decoded=jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);

    const newAccessToken= jwt.sign({id:decoded.id},process.env.JWT_SECRET,{expiresIn:"15m"});

    res.json({accessToken:newAccessToken});
  } catch (error) {
    return res.status(403).json({message:"Invalid refresh token"});
  }
}


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

module.exports = { register, login, verifyOtp, resendOtp ,refreshToken};
