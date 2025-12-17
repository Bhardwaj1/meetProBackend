const nodemailer = require("nodemailer");
const otpEmailTemplate = require("./otpTemplate");

const sendEmail = async (to, name, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = otpEmailTemplate({
    name,
    otp,
    email: to,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Verify your MeetPro account`,
    html: htmlContent,
  });
};

module.exports = sendEmail;
