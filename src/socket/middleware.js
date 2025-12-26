const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.log("❌ No token provided, blocking connection");
    return next(new Error("NO_TOKEN"));
  }

  try {
    console.log("🔑 Validating token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id name email");
    if (!user) {
      console.log("❌ User not found in DB");
      return next(new Error("USER_NOT_FOUND"));
    }

    socket.user = user; // inject user into connection
    console.log(`🟢 Auth success: ${user.name}`);
    next();

  } catch (error) {
    console.log("❌ JWT verification failed:", error.message);
    return next(new Error("INVALID_TOKEN"));
  }
};

module.exports = socketAuth;
