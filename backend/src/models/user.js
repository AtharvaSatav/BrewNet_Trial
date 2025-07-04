const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    default: "New User",
  },
  photoURL: String,
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other",
  },
  interests: [
    {
      type: String,
      default: [],
    },
  ],
  bio: {
    type: String,
    default: "Hey there! I am using BrewNet!",
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSignOut: {
    type: Date,
  },
  intent: {
    type: String,
    default: "",
  },
  intentUpdatedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
