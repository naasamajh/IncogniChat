import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLogOut, FiUsers, FiAlertTriangle, FiMessageCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTypingBlocked, setIsTypingBlocked] = useState(user?.isTypingBlocked || false);
  const [warningCount, setWarningCount] = useState(user?.warningCount || 0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('anonchat_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const socket = connectSocket(token);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('recent_messages', (msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    socket.on('user_joined', (data) => {
      setOnlineCount(data.onlineCount);
    });

    socket.on('user_left', (data) => {
      setOnlineCount(data.onlineCount);
    });

    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.anonymousName)) {
          return [...prev, data.anonymousName];
        }
        return prev;
      });
    });

    socket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => prev.filter(name => name !== data.anonymousName));
    });

    socket.on('message_filtered', (data) => {
      setWarningCount(data.warningCount);
      toast.error(data.message, { duration: 5000, icon: '⚠️' });
    });

    socket.on('typing_blocked', (data) => {
      setIsTypingBlocked(true);
      setWarningCount(data.warningCount);
      toast.error(data.message, { duration: 8000, icon: '🚫' });
    });

    socket.on('error_message', (data) => {
      toast.error(data.message);
    });

    socket.on('user_blocked', (data) => {
      if (data.userId === user?.id) {
        toast.error('Your account has been blocked by admin');
        handleLogout();
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [navigate, user, scrollToBottom]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const socket = getSocket();
    const content = newMessage.trim();

    if (!content || !socket || isTypingBlocked) return;

    socket.emit('send_message', { content });
    setNewMessage('');

    // Stop typing indicator
    socket.emit('typing_stop');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing_start');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop');
    }, 2000);
  };

  const handleLogout = async () => {
    setMessages([]);
    disconnectSocket();
    await logout();
    navigate('/');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
      '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="chat-page">
      <div className="bg-grid" />
      
      {/* Chat Header */}
      <motion.header 
        className="chat-header glass-strong"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-left">
          <span className="header-logo">🎭</span>
          <div className="header-info">
            <h1 className="header-title gradient-text">IncogniChat</h1>
            <div className="header-status">
              {isConnected ? (
                <><FiWifi className="status-icon connected" /> <span>Connected</span></>
              ) : (
                <><FiWifiOff className="status-icon disconnected" /> <span>Reconnecting...</span></>
              )}
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="online-badge">
            <FiUsers />
            <span>{onlineCount} online</span>
            <span className="online-dot" />
          </div>
        </div>

        <div className="header-right">
          {warningCount > 0 && (
            <div className="warning-badge">
              <FiAlertTriangle />
              <span>{warningCount}/5</span>
            </div>
          )}
          <div className="user-info">
            <div 
              className="user-avatar"
              style={{ background: getAvatarColor(user?.anonymousName || '?') }}
            >
              {user?.anonymousName?.charAt(0) || '?'}
            </div>
            <span className="user-name">{user?.anonymousName}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <FiLogOut />
            Logout
          </button>
        </div>
      </motion.header>

      {/* Chat Container */}
      <div className="chat-container">
        {/* Warning Banner */}
        {isTypingBlocked && (
          <motion.div 
            className="blocked-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle />
            <span>Your typing has been blocked due to repeated violations. Contact admin for assistance.</span>
          </motion.div>
        )}

        {/* Messages Area */}
        <div className="messages-area" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-chat">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <FiMessageCircle className="empty-icon" />
              </motion.div>
              <h3>Welcome to IncogniChat!</h3>
              <p>Be the first to send a message. Remember, be respectful! 🎭</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg._id || idx}
                  className={`message ${msg.anonymousName === user?.anonymousName ? 'own' : ''} ${msg.type === 'system' ? 'system' : ''}`}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.type !== 'system' && (
                    <>
                      <div 
                        className="msg-avatar"
                        style={{ background: getAvatarColor(msg.anonymousName) }}
                      >
                        {msg.anonymousName?.charAt(0)}
                      </div>
                      <div className="msg-content">
                        <div className="msg-header">
                          <span 
                            className="msg-name"
                            style={{ color: getAvatarColor(msg.anonymousName) }}
                          >
                            {msg.anonymousName}
                          </span>
                          <span className="msg-time">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="msg-text">{msg.content}</p>
                      </div>
                    </>
                  )}
                  {msg.type === 'system' && (
                    <p className="system-text">{msg.content}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="typing-dots">
                <span /><span /><span />
              </div>
              <span className="typing-text">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <motion.form 
          className="message-form glass-strong"
          onSubmit={handleSendMessage}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={isTypingBlocked ? 'Typing blocked - Contact admin' : 'Type your message...'}
            className="message-input"
            disabled={isTypingBlocked || !isConnected}
            maxLength={1000}
          />
          <motion.button
            type="submit"
            className="send-btn"
            disabled={!newMessage.trim() || isTypingBlocked || !isConnected}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSend />
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default Chat;
