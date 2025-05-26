const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetOTP: {
    type: String,
  }, // OTP for password reset
  otpExpires: {
    type: Date,
  }, // OTP expiration time
  storageLimit: {
    type: Number,
    default: 16 * 1024 * 1024 * 1024,
  },
  usedStorage: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("User", userSchema);
