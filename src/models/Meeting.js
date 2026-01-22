const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, unique: true, index: true },
    host: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostSocketId: {
      type: String,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        isMuted: {
          type: Boolean,
          default: false,
        },
        role: {
          type: String,
          enum: ["HOST", "CO_HOST", "PARTICIPANT"],
          default: "PARTICIPANT",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    waitingRoom: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    endAt: {
      type: Date,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meeting", meetingSchema);
