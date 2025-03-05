const express = require("express");
const router = express.Router();
const Connection = require("../models/connection");
const Notification = require("../models/notification");
const User = require("../models/user");
const {
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
} = require("../utils/emailService");

// Get the io instance

// Get connection status between two users
router.get("/status/:fromUserId/:toUserId", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId },
      ],
    });

    if (!connection) {
      return res.json({ status: "none" });
    }

    res.json({
      status: connection.status,
      initiator: connection.fromUser,
    });
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send connection request
router.post("/request", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Get both users' details
    const [fromUser, toUser] = await Promise.all([
      User.findOne({ firebaseUid: fromUserId }),
      User.findOne({ firebaseUid: toUserId }),
    ]);

    // Create connection
    const connection = await Connection.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: "pending",
    });

    // Send email with direct link to requester's profile
    await sendConnectionRequestEmail(toUser.email, fromUser.name, fromUserId);

    // Create and emit real-time notification
    const notification = await Notification.create({
      userId: toUserId,
      type: "connection_request",
      fromUser: {
        name: fromUser.name,
        firebaseUid: fromUserId,
      },
      read: false,
    });

    res.json({ connection });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Accept connection request
router.post("/accept", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Get both users' details
    const [fromUser, toUser] = await Promise.all([
      User.findOne({ firebaseUid: fromUserId }),
      User.findOne({ firebaseUid: toUserId }),
    ]);

    const connection = await Connection.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
        status: "pending",
      },
      { status: "accepted" },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    // Send email with direct links to profile and chat
    await sendConnectionAcceptedEmail(fromUser.email, toUser.name, toUserId);

    await Notification.create({
      userId: fromUserId,
      type: "connection_accepted",
      fromUser: {
        name: fromUser.name,
        firebaseUid: fromUserId,
      },
      read: false,
    });

    res.json({ connection });
  } catch (error) {
    console.error("Error accepting connection:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get pending connection requests
router.get("/pending/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // If checking for dummy profile's pending requests
    if (userId.startsWith("dummy")) {
      return res.json({ requests: [] });
    }

    const pendingRequests = await Connection.find({
      toUser: userId,
      status: "pending",
    });

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add auto-accept endpoint for dummy users
router.post("/auto-accept/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { toUserId } = req.body;

    // If it's a dummy profile, simulate accepting after 5 seconds
    if (toUserId.startsWith("dummy")) {
      setTimeout(() => {
        // Update the connection status in memory or temporary storage
        // This is just for simulation
      }, 5000); // 5 seconds delay

      return res.json({
        message: "Request will be auto-accepted in 5 seconds",
      });
    }

    res.status(400).json({ error: "Invalid request" });
  } catch (error) {
    console.error("Error in auto-accept:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add disconnect endpoint
router.delete("/:fromUserId/:toUserId", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.params;

    // Delete the connection
    await Connection.findOneAndDelete({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId },
      ],
    });

    // Create a notification for the other user
    await Notification.create({
      userId: toUserId,
      type: "connection_removed",
      fromUser: fromUserId,
      read: false,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add this new route to get all connections
router.get("/all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all connections where the user is either fromUser or toUser
    const connections = await Connection.find({
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    });

    // Get all unique user IDs from connections
    const userIds = connections.map(conn => 
      conn.fromUser === userId ? conn.toUser : conn.fromUser
    );

    // Fetch user details for all connected users
    const users = await User.find({
      firebaseUid: { $in: userIds }
    });

    // Create a map of user details for quick lookup
    const userMap = users.reduce((acc, user) => {
      acc[user.firebaseUid] = user;
      return acc;
    }, {});

    // Format the connections with user details
    const formattedConnections = connections.map(conn => {
      const otherUserId = conn.fromUser === userId ? conn.toUser : conn.fromUser;
      const otherUser = userMap[otherUserId];

      if (!otherUser) return null;

      return {
        firebaseUid: otherUser.firebaseUid,
        name: otherUser.name,
        interests: otherUser.interests || [],
        status: conn.status,
        initiator: conn.fromUser,
        seen: conn.seen
      };
    }).filter(Boolean); // Remove any null values

    res.json({ connections: formattedConnections });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add this new route to get unread counts
router.get("/unread-counts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all connections with unread status
    const connections = await Connection.find({
      $or: [
        { fromUser: userId, status: 'accepted', seen: false },
        { toUser: userId, status: 'pending', seen: false }
      ]
    });

    // Count unread requests and accepted connections
    const counts = {
      newRequests: connections.filter(conn => 
        conn.toUser === userId && conn.status === 'pending' && !conn.seen
      ).length,
      newConnections: connections.filter(conn => 
        conn.status === 'accepted' && !conn.seen
      ).length
    };

    res.json(counts);
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add route to mark connections as seen
router.put("/mark-seen", async (req, res) => {
  try {
    const { userId, connectionId } = req.body;
    
    // Update specific connection
    await Connection.findOneAndUpdate(
      {
        $or: [
          { fromUser: userId, toUser: connectionId },
          { fromUser: connectionId, toUser: userId }
        ]
      },
      { seen: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking connection as seen:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
