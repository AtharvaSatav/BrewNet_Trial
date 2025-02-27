const express = require("express");
const router = express.Router();
const Connection = require("../models/connection");
const Notification = require("../models/notification");
const User = require("../models/user");
const {
  sendConnectionRequestEmail,
  sendConnectionAcceptedEmail,
} = require("../utils/emailService");

// Get socket instance inside handlers
const socketIO = require("../socket");

// 🚀 Send Connection Request
router.post("/request", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Get both users' details
    const [fromUser, toUser] = await Promise.all([
      User.findOne({ firebaseUid: fromUserId }),
      User.findOne({ firebaseUid: toUserId }),
    ]);

    // Create connection request
    const connection = await Connection.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: "pending",
    });

    // Send email with profile link
    await sendConnectionRequestEmail(toUser.email, fromUser.name, fromUserId);

    // Create notification
    const notification = await Notification.create({
      userId: toUserId,
      type: "connection_request",
      fromUser: fromUserId,
      read: false,
    });

    // ✅ Use `getIO()` instead of `io`
    try {
      const io = socketIO.getIO();
      io.to(toUserId).emit("notification", notification);
    } catch (error) {
      console.error("Socket.IO not initialized:", error.message);
    }

    res.json({ connection });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 Accept Connection Request
router.post("/accept", async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    // Get user details
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

    // Send email
    await sendConnectionAcceptedEmail(fromUser.email, toUser.name, toUserId);

    // Create notification
    const notification = await Notification.create({
      userId: fromUserId,
      type: "connection_accepted",
      fromUser: fromUser.firebaseUid,
      read: false,
    });

    // ✅ Use `getIO()` dynamically
    try {
      const io = socketIO.getIO();
      io.to(fromUserId).emit("notification", notification);
    } catch (error) {
      console.error("Socket.IO not initialized:", error.message);
    }

    res.json({ connection });
  } catch (error) {
    console.error("Error accepting connection:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
