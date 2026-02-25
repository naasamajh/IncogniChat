const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { moderateMessage } = require('../utils/moderator');

const setupSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.isDeleted) {
        return next(new Error('User not found'));
      }

      user.checkBlockExpiry();
      await user.save();

      if (user.isBlocked) {
        return next(new Error('Account is blocked'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔗 User connected: ${socket.user.anonymousName}`);

    // Update online status
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true, lastSeen: new Date() });

    // Join the global chatroom
    socket.join('global-chat');

    // Broadcast user joined
    io.to('global-chat').emit('user_joined', {
      anonymousName: socket.user.anonymousName,
      onlineCount: io.engine.clientsCount
    });

    // Start with a fresh chat - no previous messages loaded
    socket.emit('recent_messages', []);

    // Send online count
    io.to('global-chat').emit('online_count', io.engine.clientsCount);

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const user = await User.findById(socket.user._id);

        if (!user || user.isDeleted || user.isBlocked) {
          socket.emit('error_message', { message: 'Your account is restricted' });
          return;
        }

        if (user.isTypingBlocked) {
          socket.emit('error_message', { 
            message: 'Your typing has been blocked due to repeated violations. Contact admin for help.' 
          });
          return;
        }

        const content = data.content?.trim();
        if (!content || content.length === 0) return;
        if (content.length > 1000) {
          socket.emit('error_message', { message: 'Message too long (max 1000 characters)' });
          return;
        }

        // Moderate content
        const modResult = await moderateMessage(content);

        if (modResult.isInappropriate) {
          // Increment warning count
          user.warningCount = (user.warningCount || 0) + 1;

          // Save filtered message for admin records
          await Message.create({
            sender: user._id,
            anonymousName: user.anonymousName,
            content: content,
            isFiltered: true,
            filterReason: modResult.reason,
            type: 'warning'
          });

          if (user.warningCount >= 6) {
            // Block typing on 6th warning
            user.isTypingBlocked = true;
            await user.save();

            socket.emit('typing_blocked', {
              message: '🚫 Your typing has been permanently blocked due to repeated violations (6 warnings). Contact admin.',
              warningCount: user.warningCount
            });
          } else {
            await user.save();

            socket.emit('message_filtered', {
              message: `⚠️ Your message was blocked due to inappropriate content. Warning ${user.warningCount}/5. You will be blocked at 6 warnings.`,
              warningCount: user.warningCount,
              remainingWarnings: 6 - user.warningCount
            });
          }
          return;
        }

        // Save message
        const message = await Message.create({
          sender: user._id,
          anonymousName: user.anonymousName,
          content: content,
          type: 'message'
        });

        // Broadcast to all users
        io.to('global-chat').emit('new_message', {
          _id: message._id,
          anonymousName: user.anonymousName,
          content: message.content,
          type: 'message',
          createdAt: message.createdAt
        });
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', () => {
      socket.to('global-chat').emit('user_typing', {
        anonymousName: socket.user.anonymousName
      });
    });

    socket.on('typing_stop', () => {
      socket.to('global-chat').emit('user_stop_typing', {
        anonymousName: socket.user.anonymousName
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.anonymousName}`);
      
      // Delete ALL messages from DB (ephemeral chat - fresh start each session)
      await Message.deleteMany({});

      await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastSeen: new Date() });

      io.to('global-chat').emit('user_left', {
        anonymousName: socket.user.anonymousName,
        onlineCount: io.engine.clientsCount
      });

      io.to('global-chat').emit('online_count', io.engine.clientsCount);
    });
  });
};

module.exports = setupSocket;
