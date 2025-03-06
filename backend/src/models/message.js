const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema); 