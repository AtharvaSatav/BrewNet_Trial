const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  fromUser: {
    type: String,
    required: true
  },
  toUser: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Connection', connectionSchema); 