const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const Connection = require('../models/connection');

// Get chat history between two users
router.get('/history/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    // Verify users are connected
    const connection = await Connection.findOne({
      $or: [
        { fromUser: userId1, toUser: userId2, status: 'accepted' },
        { fromUser: userId2, toUser: userId1, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ error: 'Users are not connected' });
    }

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save new message
router.post('/message', async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    // Verify users are connected
    const connection = await Connection.findOne({
      $or: [
        { fromUser: senderId, toUser: receiverId, status: 'accepted' },
        { fromUser: receiverId, toUser: senderId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ error: 'Users are not connected' });
    }

    // Create and save message
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      timestamp: Date.now()
    });

    res.json({ message });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 