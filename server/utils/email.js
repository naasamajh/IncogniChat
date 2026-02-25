const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"IncogniChat" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Verify Your IncogniChat Account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="color: #a78bfa; font-size: 32px; margin-bottom: 10px;">🎭 IncogniChat</h1>
          <p style="color: #c4b5fd; font-size: 16px;">Anonymous. Secure. Real-time.</p>
        </div>
        <div style="padding: 30px; background: rgba(255,255,255,0.05); border-top: 1px solid rgba(167,139,250,0.3);">
          <h2 style="color: #e2e8f0; font-size: 20px;">Hello, ${fullName}! 👋</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Welcome to IncogniChat! Use the following OTP to verify your email address:</p>
          <div style="background: linear-gradient(135deg, #7c3aed, #a78bfa); border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">⏰ This OTP expires in <strong style="color: #a78bfa;">10 minutes</strong></p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #475569; font-size: 12px;">© 2026 IncogniChat. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send account action email (block, delete, etc.)
const sendAccountActionEmail = async (email, fullName, action, reason = '') => {
  const transporter = createTransporter();

  const actionMessages = {
    'blocked_24h': {
      subject: '⚠️ IncogniChat - Account Temporarily Blocked',
      title: 'Account Temporarily Blocked',
      message: 'Your account has been blocked for 24 hours due to violation of community guidelines.',
      color: '#f59e0b'
    },
    'blocked_permanent': {
      subject: '🚫 IncogniChat - Account Permanently Blocked',
      title: 'Account Permanently Blocked',
      message: 'Your account has been permanently blocked due to repeated violations of community guidelines.',
      color: '#ef4444'
    },
    'deleted': {
      subject: '❌ IncogniChat - Account Deleted',
      title: 'Account Deleted',
      message: 'Your account has been deleted by an administrator.',
      color: '#ef4444'
    },
    'unblocked': {
      subject: '✅ IncogniChat - Account Unblocked',
      title: 'Account Unblocked',
      message: 'Your account has been unblocked. You can now access IncogniChat again.',
      color: '#10b981'
    },
    'warning': {
      subject: '⚠️ IncogniChat - Warning',
      title: 'Warning Notice',
      message: 'You have received a warning for inappropriate behavior in the chatroom.',
      color: '#f59e0b'
    }
  };

  const config = actionMessages[action] || actionMessages['warning'];

  const mailOptions = {
    from: `"IncogniChat Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: config.subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="color: #a78bfa; font-size: 32px; margin-bottom: 10px;">🎭 IncogniChat</h1>
          <p style="color: #c4b5fd; font-size: 16px;">Admin Notification</p>
        </div>
        <div style="padding: 30px; background: rgba(255,255,255,0.05); border-top: 1px solid rgba(167,139,250,0.3);">
          <h2 style="color: ${config.color}; font-size: 22px;">${config.title}</h2>
          <p style="color: #e2e8f0; font-size: 15px;">Dear ${fullName},</p>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">${config.message}</p>
          ${reason ? `<p style="color: #94a3b8; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>` : ''}
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #64748b; font-size: 13px;">If you believe this is a mistake, please contact our support team.</p>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #475569; font-size: 12px;">© 2026 IncogniChat. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTPEmail, sendAccountActionEmail, generateOTP };
