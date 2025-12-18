const express = require("express");
const {
  register,
  login,
  verifyOtp,
} = require("../controllers/auth.controller");
const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
} = require("../validations/auth.validation");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/login", validate(loginSchema), login);

module.exports = router;
