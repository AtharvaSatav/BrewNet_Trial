const express = require("express");
const router = express.Router();
const admin = require("../config/firebase-admin");
const User = require("../models/user");

router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if user exists in database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || "New User",
        photoURL: decodedToken.picture,
        gender: "other",
        interests: [],
        onboardingCompleted: false,
      });

      return res.json({
        user,
        needsOnboarding: true,
      });
    }

    // For existing users, check if onboarding is completed
    await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid.toString() },
      { isOnline: true },
      { new: true }
    );

    res.json({
      user,
      needsOnboarding: !user.onboardingCompleted,
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({
      error: "Authentication failed",
      details: error.message,
    });
  }
});

router.get("/check-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ exists: false });
    }

    res.json({
      exists: true,
      name: user.name,
      gender: user.gender,
      interests: user.interests,
    });
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/complete-onboarding", async (req, res) => {
  try {
    const { firebaseUid, name, gender, interests } = req.body;

    // Update user and explicitly set onboardingCompleted to true
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          name,
          gender,
          interests,
          onboardingCompleted: true,
        },
      },
      { new: true }
    );
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        isOnline: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: updatedUser,
      needsOnboarding: false,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/user/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    // Check if it's a dummy profile
    if (firebaseUid.startsWith("dummy")) {
      const dummyUser = {
        firebaseUid,
        name: "Dummy User",
        gender: "Not Specified",
        interests: ["Coffee"],
        // Add any other required fields
      };
      return res.json({ user: dummyUser });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/update-profile", async (req, res) => {
  try {
    const { firebaseUid, name, gender, interests } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { name, gender, interests },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:user", async (req, res) => {
  const { user } = req.params;
  try {
    const users = await User.find(
      { isOnline: true, firebaseUid: { $ne: user } },
      {
        firebaseUid: 1,
        name: 1,
        interests: 1,
        gender: 1,
        _id: 0,
      }
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/sign-out - Handle user sign out
router.post("/sign-out", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Update user's status in database
    const user = await User.findOneAndUpdate(
      { firebaseUid: userId },
      {
        lastSignOut: new Date(),
        isOnline: false,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Sign out successful" });
  } catch (error) {
    console.error("Error handling sign out:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
