const asyncHandler = require("express-async-handler");
const Exceljs = require("exceljs");
const MeetingHistory = require("../models/MeetingHistory");
const getMeetingsHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    MeetingHistory.find({ user: userId })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name email")
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

const exportMeeting = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  console.log(req.user.name, "nameeeeeeeeeeeeeeeeeeeee");

  // filter same as api list
  const { search, fromDate, toDate, status } = req.query;
  const filter = { user: userId };

  if (status) {
    filter.status = status;
  }

  if (fromDate || toDate) {
    filter.joinedAt = {};
    if (fromDate) {
      filter.joinedAt.$gte = new Date(fromDate);
      filter.joinedAt.$lte = new Date(toDate);
    }
  }

  const records = await MeetingHistory.find(filter)
    .sort({ joinedAt: -1 })
    .populate("user", "name email")
    .lean();
  const workbook = new Exceljs.Workbook();
  const worksheet = workbook.addWorksheet(`${req.user.name} Meeting History`);

  worksheet.columns = [
    { header: "User Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Status", key: "status", width: 15 },
    { header: "Joined At", key: "joinedAt", width: 25 },
  ];

  records.forEach((item) => {
    worksheet.addRow({
      name: item?.user?.name,
      email: item?.user?.email,
      status: item?.status,
      joinedAt: item?.joinedAt,
    });
  });
  worksheet.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=meeting-history.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
});
module.exports = { getMeetingsHistory, exportMeeting };
