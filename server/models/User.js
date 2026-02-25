const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must not exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  anonymousName: {
    type: String,
    unique: true,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: { type: String, select: false },
    expiresAt: { type: Date, select: false }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  warningCount: {
    type: Number,
    default: 0
  },
  isTypingBlocked: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockType: {
    type: String,
    enum: ['none', '24h', 'permanent'],
    default: 'none'
  },
  blockedAt: {
    type: Date,
    default: null
  },
  blockExpiresAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if 24h block has expired
userSchema.methods.checkBlockExpiry = function() {
  if (this.blockType === '24h' && this.blockExpiresAt && new Date() > this.blockExpiresAt) {
    this.isBlocked = false;
    this.blockType = 'none';
    this.blockedAt = null;
    this.blockExpiresAt = null;
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
