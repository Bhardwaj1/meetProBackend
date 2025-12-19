const express = require("express");
const {
  register,
  login,
  verifyOtp,
  resendOtp,
} = require("../controllers/auth.controller");
const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  verifyResendOtpSchema,
} = require("../validations/auth.validation");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validate(verifyResendOtpSchema), resendOtp);
router.post("/login", validate(loginSchema), login);

module.exports = router;
