const User = require('../models/User');
const Message = require('../models/Message');
const { sendAccountActionEmail } = require('../utils/email');

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';
    const skip = (page - 1) * limit;

    let query = { role: { $ne: 'admin' } };

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { anonymousName: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (filter === 'blocked') query.isBlocked = true;
    else if (filter === 'active') { query.isBlocked = false; query.isDeleted = false; }
    else if (filter === 'deleted') query.isDeleted = true;
    else if (filter === 'warned') { query.warningCount = { $gt: 0 }; }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get stats
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: false, isDeleted: false });
    const blockedUsers = await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: true });
    const onlineUsers = await User.countDocuments({ role: { $ne: 'admin' }, isOnline: true });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        onlineUsers
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get message count
    const messageCount = await Message.countDocuments({ sender: user._id });
    const flaggedMessages = await Message.countDocuments({ sender: user._id, isFiltered: true });

    res.status(200).json({
      success: true,
      user,
      messageCount,
      flaggedMessages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Block user (24h or permanent)
// @route   PUT /api/admin/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const { blockType, reason } = req.body; // blockType: '24h' or 'permanent'
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block admin' });
    }

    user.isBlocked = true;
    user.blockType = blockType;
    user.blockedAt = new Date();

    if (blockType === '24h') {
      user.blockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      user.blockExpiresAt = null;
    }

    await user.save();

    // Send email notification
    const action = blockType === '24h' ? 'blocked_24h' : 'blocked_permanent';
    sendAccountActionEmail(user.email, user.fullName, action, reason);

    // Emit socket event to disconnect user
    const io = req.app.get('io');
    if (io) {
      io.emit('user_blocked', { userId: user._id.toString() });
    }

    res.status(200).json({
      success: true,
      message: `User blocked ${blockType === '24h' ? 'for 24 hours' : 'permanently'}`
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Unblock user
// @route   PUT /api/admin/users/:id/unblock
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = false;
    user.blockType = 'none';
    user.blockedAt = null;
    user.blockExpiresAt = null;
    await user.save();

    sendAccountActionEmail(user.email, user.fullName, 'unblocked');

    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin' });
    }

    user.isDeleted = true;
    user.isOnline = false;
    await user.save();

    sendAccountActionEmail(user.email, user.fullName, 'deleted', reason);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('user_blocked', { userId: user._id.toString() });
    }

    res.status(200).json({ success: true, message: 'User account deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset user warnings
// @route   PUT /api/admin/users/:id/reset-warnings
exports.resetWarnings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.warningCount = 0;
    user.isTypingBlocked = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Warnings reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get chat messages (for admin monitoring)
// @route   GET /api/admin/messages
exports.getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .populate('sender', 'fullName email anonymousName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments();

    res.status(200).json({
      success: true,
      messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: false, isDeleted: false });
    const blockedUsers = await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: true });
    const onlineUsers = await User.countDocuments({ role: { $ne: 'admin' }, isOnline: true });
    const totalMessages = await Message.countDocuments();
    const flaggedMessages = await Message.countDocuments({ isFiltered: true });
    const deletedAccounts = await User.countDocuments({ isDeleted: true });

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, role: { $ne: 'admin' } });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        onlineUsers,
        totalMessages,
        flaggedMessages,
        deletedAccounts,
        recentSignups
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get analytics data (charts/graphs)
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    // 1. User Growth - signups per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, role: { $ne: 'admin' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with 0
    const growthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = userGrowth.find(g => g._id === dateStr);
      growthData.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: found ? found.count : 0
      });
    }

    // 2. User Status Distribution
    const statusDistribution = {
      active: await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: false, isDeleted: false }),
      blocked24h: await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: true, blockType: '24h' }),
      blockedPermanent: await User.countDocuments({ role: { $ne: 'admin' }, isBlocked: true, blockType: 'permanent' }),
      deleted: await User.countDocuments({ role: { $ne: 'admin' }, isDeleted: true }),
      unverified: await User.countDocuments({ role: { $ne: 'admin' }, isVerified: false })
    };

    // 3. Warning Distribution
    const warningDistribution = {
      clean: await User.countDocuments({ role: { $ne: 'admin' }, warningCount: 0, isDeleted: false }),
      low: await User.countDocuments({ role: { $ne: 'admin' }, warningCount: { $gte: 1, $lte: 2 }, isDeleted: false }),
      medium: await User.countDocuments({ role: { $ne: 'admin' }, warningCount: { $gte: 3, $lte: 4 }, isDeleted: false }),
      high: await User.countDocuments({ role: { $ne: 'admin' }, warningCount: { $gte: 5 }, isDeleted: false }),
      typingBlocked: await User.countDocuments({ role: { $ne: 'admin' }, isTypingBlocked: true })
    };

    // 4. Hourly Activity (based on lastSeen timestamps from last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hourlyActivity = await User.aggregate([
      { $match: { lastSeen: { $gte: sevenDaysAgo }, role: { $ne: 'admin' } } },
      {
        $group: {
          _id: { $hour: '$lastSeen' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill all 24 hours
    const activityData = [];
    for (let h = 0; h < 24; h++) {
      const found = hourlyActivity.find(a => a._id === h);
      activityData.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        count: found ? found.count : 0
      });
    }

    // 5. Message stats (last 7 days breakdown)
    const msgStats = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          flagged: { $sum: { $cond: ['$isFiltered', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const messageData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = msgStats.find(m => m._id === dateStr);
      messageData.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total: found ? found.total : 0,
        flagged: found ? found.flagged : 0
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        userGrowth: growthData,
        statusDistribution,
        warningDistribution,
        hourlyActivity: activityData,
        messageActivity: messageData
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
