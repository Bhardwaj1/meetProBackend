const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED"],
      default: "CREATED",
    },
    provider: {
      type: String,
      enum: ["DUMMY", "RAZORPAY"],
      default: "DUMMY",
    },
    providerOrderId: {
      type: String,
    },
    providerPaymentId: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
