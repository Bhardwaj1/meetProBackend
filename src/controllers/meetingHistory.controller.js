const asyncHandler = require("express-async-handler");
const MeetingHistory = require("../models/MeetingHistory");
const getMeetingsHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    MeetingHistory.find({ user: userId })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(Number(limit)).populate("user","name email")
      .lean(),
    MeetingHistory.countDocuments({ user: userId }),
  ]);

  res.json({
    success: true,
    data: records,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});
module.exports = { getMeetingsHistory };
