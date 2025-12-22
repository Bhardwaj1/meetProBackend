const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
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
