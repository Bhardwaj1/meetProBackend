const joi = require("joi");

// Register validation

const registerSchema = joi.object({
  name: joi.string().min(2).max(50).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
  confirmPassword: joi
    .string()
    .valid(joi.ref("password"))
    .required()
    .messages({ "any.only": "Password donot match" }),
});

const verifyOtpSchema = joi.object({
  email: joi.string().email().required(),
  otp: joi.string().length(6).required(),
});

const verifyResendOtpSchema = joi.object({
  email: joi.string().email().required(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

module.exports = { registerSchema, verifyOtpSchema, loginSchema,verifyResendOtpSchema };



