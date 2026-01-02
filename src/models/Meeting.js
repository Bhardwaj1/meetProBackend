const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  participants: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      isMuted: {
        type: Boolean,
        default: false,
      },
      role:{
        type:String,
        enum:["HOST","CO_HOST","PARTICIPANT"],
        default:"PARTICIPANT",
      }
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  endAt: {
    type: Date,
  },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Meeting", meetingSchema);
