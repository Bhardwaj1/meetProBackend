const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ["FREE", "PREMIUM"],
    default: "FREE",
  },
  startAt: {
    type: Date,
  },
  endAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
