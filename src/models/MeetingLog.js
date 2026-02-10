const mongoose = require("mongoose");

const meetingLogSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "MEETING_CREATED",
        "USER_JOINED",
        "USER_LEFT",
        "SELF_MUTED",
        "SELF_UNMUTED",
        "HOST_MUTED",
        "HOST_UNMUTED",
        "USER_KICKED",
        "MEETING_ENDED",
        "USER_PROMOTED_CO_HOST",
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MeetingLogs", meetingLogSchema);
