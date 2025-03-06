const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const Connection = require('../models/connection');
const User = require('../models/user');

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

    // Create and save message with read: false
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
      read: false  // Explicitly set read to false
    });

    res.json({ message });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this new route
router.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all accepted connections
    const connections = await Connection.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' }
      ]
    });

    // Get profiles with their last messages and unread counts
    const profiles = await Promise.all(connections.map(async (conn) => {
      const otherUserId = conn.fromUser === userId ? conn.toUser : conn.fromUser;
      const user = await User.findOne({ firebaseUid: otherUserId });
      
      // Get last message
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      }).sort({ timestamp: -1 });

      // Get unread count
      const unreadCount = await Message.countDocuments({
        senderId: otherUserId,
        receiverId: userId,
        read: false
      });

      return {
        firebaseUid: user.firebaseUid,
        name: user.name,
        lastMessage: lastMessage?.text,
        lastMessageTime: lastMessage?.timestamp,
        unreadCount
      };
    }));

    res.json({ profiles });
  } catch (error) {
    console.error('Error fetching chat profiles:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add route for getting total unread messages
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this route to mark messages as read
router.put('/read/:senderId/:receiverId', async (req, res) => {
  try {
    await Message.updateMany(
      { 
        senderId: req.params.senderId,
        receiverId: req.params.receiverId,
        read: false
      },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 