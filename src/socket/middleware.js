const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id name email");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user; // 🔥 attach user to socket
    next();
  } catch (err) {
    if (err.name == "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    return next(new Error("Authentication failed"));
  }
};

module.exports = socketAuth;
