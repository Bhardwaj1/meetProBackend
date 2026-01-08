const express = require("express");
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  refreshToken,
} = require("../controllers/auth.controller");
const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  verifyResendOtpSchema,
} = require("../validations/auth.validation");
const validate = require("../middleware/validate");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

router.post("/refresh-token",refreshToken)

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post("/resend-otp", validate(verifyResendOtpSchema), resendOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validate(loginSchema), login);

module.exports = router;
