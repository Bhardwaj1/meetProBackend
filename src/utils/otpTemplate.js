const otpEmailTemplate = ({ name, otp, email }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f7fa; }
    .container { max-width: 600px; margin: auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px; color: white; text-align: center; }
    .content { padding: 40px; }
    .otp-box { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; font-size: 48px; padding: 20px; text-align: center; border-radius: 12px; letter-spacing: 6px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 MeetPro</h1>
      <p>Where Connections Become Opportunities</p>
    </div>

    <div class="content">
      <h2>Hello ${name} 👋</h2>
      <p>Welcome to <strong>MeetPro</strong> 🎉</p>

      <p>Your One-Time Password (OTP) is:</p>
      <div class="otp-box">${otp}</div>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>Never share this OTP with anyone.</p>

      <p>– MeetPro Team 💼</p>
    </div>

    <div class="footer">
      © 2026 MeetPro <br/>
      Sent to ${email}
    </div>
  </div>
</body>
</html>
`;

module.exports = otpEmailTemplate;
