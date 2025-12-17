const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://bhardwajgaurav204_db_user:WzV2Usr4qXaOC02S@meetprocluster.a9u2rng.mongodb.net/meetPro`
    );

    console.log(`MongoDB Connected`);
  } catch (error) {
    console.log(error.message, "❌ MongoDB connection failed");
    process.exit(1);
  }
};

module.exports = connectDB;
