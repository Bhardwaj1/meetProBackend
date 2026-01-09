const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken:{
      type:String,
      default:null
    },
    otp: String,
    otpExipreAt: Date,
    googleId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
