const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, unique: true, index: true },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    host: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    invitedUsers: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        user:{
          type:mongoose.Schema.ObjectId,
          ref:"User",
          default:null,
        },
        invitedAt:{
          type:Date,
          default:Date.now(),
        },
        status:{
          type:String,
          enum:["INVITED","REGISTERED","JOINED"],
          default:"INVITED"
        }
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
    scheduledAt: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "ACTIVE", "ENDED"],
      default: "ACTIVE",
      index: true,
    },
    endAt: {
      type: Date,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meeting", meetingSchema);
