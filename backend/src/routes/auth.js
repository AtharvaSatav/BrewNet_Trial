const express = require("express");
const router = express.Router();
const admin = require("../config/firebase-admin");
const User = require("../models/user");
const Message = require("../models/message");

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
    const { firebaseUid, name, gender, interests, bio } = req.body;
    console.log("Received onboarding data:", {
      firebaseUid,
      name,
      gender,
      interests,
      bio,
    });

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          name,
          gender,
          interests,
          bio,
          onboardingCompleted: true,
        },
      },
      { new: true }
    );

    console.log("Updated user:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        name: updatedUser.name,
        gender: updatedUser.gender,
        interests: updatedUser.interests,
        bio: updatedUser.bio || "",
      },
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
    const user = await User.findOne({ firebaseUid });

    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/update-profile", async (req, res) => {
  try {
    const { firebaseUid, name, gender, interests, bio } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { name, gender, interests, bio },
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

router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profiles = await User.find({ 
      firebaseUid: { $ne: userId },
      isOnline: true 
    });
    
    const profilesWithCounts = await Promise.all(profiles.map(async (profile) => {
      // Check for messages that either don't have read field or read is false
      const messages = await Message.find({
        from: profile.firebaseUid,
        to: userId,
        $or: [
          { read: { $exists: false } },
          { read: false }
        ]
      });
      
      console.log('Messages found for', profile.name + ':', messages);
      const unreadCount = messages.length;
      
      return {
        ...profile.toObject(),
        unreadMessages: unreadCount
      };
    }));

    res.json(profilesWithCounts);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
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

// Add these functions at the top of the file
async function exchangeLinkedInCodeForToken(code) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "authorization_code");
  urlencoded.append("code", code);
  urlencoded.append("redirect_uri", process.env.LINKEDIN_REDIRECTION_URI);
  urlencoded.append("client_id", process.env.LINKEDIN_CLIENT_ID);
  urlencoded.append("client_secret", process.env.LINKEDIN_CLIENT_SECRET);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  const response = await fetch(
    process.env.LINKEDIN_ACCESS_TOKEN_URL,
    requestOptions
  );
  const result = await response.text();
  const res = JSON.parse(result);
  return res.access_token;
}

async function retrieveMemberDetails(accessToken) {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${accessToken}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(process.env.LINKEDIN_USERINFO, requestOptions);
  const result = await response.json();
  return {
    name: result.name,
    profile: result.picture,
    email: result.email,
  };
}

// Update the LinkedIn authentication endpoint
router.post("/linkedin", async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const accessToken = await exchangeLinkedInCodeForToken(code);

    // Get user profile from LinkedIn
    const profileData = await retrieveMemberDetails(accessToken);

    // Create or update user in database
    let user = await User.findOne({ email: profileData.email });

    if (!user) {
      user = await User.create({
        firebaseUid: `linkedin_${Date.now()}`,
        email: profileData.email,
        name: profileData.name,
        photoURL: profileData.profile,
        onboardingCompleted: false,
      });

      return res.json({
        user,
        needsOnboarding: true,
      });
    }

    res.json({
      user,
      needsOnboarding: !user.onboardingCompleted,
    });
  } catch (error) {
    console.error("LinkedIn auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = router;
