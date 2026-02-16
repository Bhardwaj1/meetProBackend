const mongoose = require("mongoose");

const meetingHistorySchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },
  role: {
    type: String,
    enum: ["HOST", "CO_HOST", "PARTICIPANT"],
    default: "PARTICIPANT",
  },
  joinedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  leftAt: {
    type: Date,
    default: null,
  },
});

// Virtual field for status
meetingHistorySchema.virtual("status").get(function () {
  return this.leftAt ? "Completed" : "Ongoing";
});

// Ensure virtuals are included in JSON
meetingHistorySchema.set("toJSON", { virtuals: true });
meetingHistorySchema.set("toObject", { virtuals: true });

meetingHistorySchema.index({ meetingId: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("MeetingHistory", meetingHistorySchema);
