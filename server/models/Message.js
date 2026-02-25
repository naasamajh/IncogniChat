const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  anonymousName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Message must not exceed 1000 characters']
  },
  isFiltered: {
    type: Boolean,
    default: false
  },
  filterReason: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['message', 'system', 'warning'],
    default: 'message'
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
