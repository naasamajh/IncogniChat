const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { generateOTP, sendOTPEmail, sendAccountActionEmail } = require('../utils/email');
const { generateAnonymousName } = require('../utils/nameGenerator');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register new user - Step 1: Send OTP
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique anonymous name
    let anonymousName;
    let isUnique = false;
    while (!isUnique) {
      anonymousName = generateAnonymousName();
      const existing = await User.findOne({ anonymousName });
      if (!existing) isUnique = true;
    }

    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified user
      existingUser.fullName = fullName;
      existingUser.password = password;
      existingUser.otp = { code: otp, expiresAt: otpExpiry };
      await existingUser.save();
    } else {
      // Create new user
      await User.create({
        fullName,
        email,
        password,
        anonymousName,
        otp: { code: otp, expiresAt: otpExpiry }
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, fullName);
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Still return success - user can request resend
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+otp.code +otp.expiresAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        anonymousName: user.anonymousName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = { code: otp, expiresAt: otpExpiry };
    await user.save();

    try {
      await sendOTPEmail(email, otp, user.fullName);
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
    }

    res.status(200).json({ success: true, message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for admin login
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // Find or create admin user
      let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
      
      if (!admin) {
        admin = await User.create({
          fullName: 'Admin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          anonymousName: 'SystemAdmin',
          isVerified: true,
          role: 'admin'
        });
      }

      const token = generateToken(admin._id);
      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        user: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          anonymousName: admin.anonymousName,
          role: 'admin'
        }
      });
    }

    // Regular user login
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }

    if (user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Your account has been deleted' });
    }

    // Check block status
    user.checkBlockExpiry();
    await user.save();

    if (user.isBlocked) {
      const blockMsg = user.blockType === 'permanent' 
        ? 'Your account has been permanently blocked'
        : `Your account is blocked until ${user.blockExpiresAt?.toLocaleString()}`;
      return res.status(403).json({ success: false, message: blockMsg });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        anonymousName: user.anonymousName,
        role: user.role,
        warningCount: user.warningCount,
        isTypingBlocked: user.isTypingBlocked
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Check block expiry
    user.checkBlockExpiry();
    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        anonymousName: user.anonymousName,
        role: user.role,
        warningCount: user.warningCount,
        isTypingBlocked: user.isTypingBlocked,
        isBlocked: user.isBlocked,
        blockType: user.blockType,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // Delete all messages (ephemeral chat - fresh start each session)
    await Message.deleteMany({});

    // Update user status
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: new Date() });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
