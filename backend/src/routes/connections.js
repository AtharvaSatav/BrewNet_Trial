const express = require('express');
const router = express.Router();
const Connection = require('../models/connection');
const Notification = require('../models/notification');

// Get connection status between two users
router.get('/status/:fromUserId/:toUserId', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    
    const connection = await Connection.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId }
      ]
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    res.json({ 
      status: connection.status,
      initiator: connection.fromUser 
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send connection request
router.post('/request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Create connection with pending status
    const connection = await Connection.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'pending'
    });

    // Create notification for recipient
    await Notification.create({
      userId: toUserId,
      type: 'connection_request',
      fromUser: fromUserId,
      read: false
    });

    res.json({ connection });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept connection request
router.post('/accept', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Update connection status to accepted
    const connection = await Connection.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        status: 'pending'
      },
      { status: 'accepted' },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Create notification for the original sender
    await Notification.create({
      userId: fromUserId,
      type: 'connection_accepted',
      fromUser: toUserId,
      read: false
    });

    res.json({ connection });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending connection requests
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // If checking for dummy profile's pending requests
    if (userId.startsWith('dummy')) {
      return res.json({ requests: [] });
    }

    const pendingRequests = await Connection.find({
      toUser: userId,
      status: 'pending'
    });

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add auto-accept endpoint for dummy users
router.post('/auto-accept/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { toUserId } = req.body;

    // If it's a dummy profile, simulate accepting after 5 seconds
    if (toUserId.startsWith('dummy')) {
      setTimeout(() => {
        // Update the connection status in memory or temporary storage
        // This is just for simulation
        console.log(`Dummy user ${toUserId} accepted connection request`);
      }, 5000); // 5 seconds delay

      return res.json({ message: 'Request will be auto-accepted in 5 seconds' });
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Error in auto-accept:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add disconnect endpoint
router.delete('/:fromUserId/:toUserId', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;
    
    // Delete the connection
    await Connection.findOneAndDelete({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId }
      ]
    });

    // Create a notification for the other user
    await Notification.create({
      userId: toUserId,
      type: 'connection_removed',
      fromUser: fromUserId,
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 