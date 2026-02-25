const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  deleteUser,
  resetWarnings,
  getMessages,
  getDashboardStats,
  getAnalytics
} = require('../controllers/adminController');

// All routes require admin authentication
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.put('/users/:id/reset-warnings', resetWarnings);
router.delete('/users/:id', deleteUser);
router.get('/messages', getMessages);

module.exports = router;
