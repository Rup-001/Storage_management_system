const User = require('../models/user.model')
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendOTP } = require("../utils/sendEmail");
const Folder = require("../models/folder.model");
const fs = require("fs").promises;
const path = require("path");

exports.sendOTPEmail = async (req, res) => {
  try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ message: "Email is required" });

      let user = await User.findOne({ email });

      // If user doesn't exist, create a new entry
      if (!user) {
        return res.status(400).json({ message: "No user found in this mail" });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in DB with expiration time (10 minutes)
      user.resetOTP = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 min
      await user.save();

      // Send OTP email
      await sendOTP(email, otp);

      res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
      console.error("Send OTP Error:", error);
      res.status(500).json({ message: "Internal server error" });
  } finally {
    console.log("sendOTPEmail attempt finished.");
}
};


exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // OTP is valid — optionally clear it from DB now or after password reset
    return res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Server error during OTP verification" });
  } finally {
    console.log("verifyOTP attempt finished.");
}
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }


    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOTP = null;
    user.otpExpires = null;

    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Server error during password reset" });
  } finally {
    console.log("resetPassword attempt finished.");
}
};



exports.loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if email is provided in the request body
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }
  
      // Determine whether the input is an email or username
      let user;
      if (email) {
        // If it contains '@', it's an email
        user = await User.findOne({ email: email });
      } 
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found or invalid Email",
        });
      }
  
      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password",
        });
      }
  
      // Create the JWT payload
      const payload = {
        id: user._id,              // User's unique ID
        username: user.username,   // Username
        email: user.email,         // Email
      };
  
      // Sign the JWT (create the token)
      const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "2d" });
  
      // Send the Bearer token to the client
      res.status(200).json({
        success: true,
        message: `Logged in as ${user.username}`,
        token: `Bearer ${token}`,  // Send token as Bearer token
        username: user.username,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server error during login." });
    } finally {
      console.log("Login attempt finished.");
  }
  };


  exports.registrationUser = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email or username already exists" });
      }
  
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const STORAGE_LIMIT = 16 * 1024 * 1024 * 1024; // 16GB
  
      // Create a new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        storageLimit: STORAGE_LIMIT,
        usedStorage: 0,
      });
  
      // Create Root Folder for the User
      const rootFolder = new Folder({
        name: "My Drive",
        user: newUser._id,
        parentFolder: null,
        isFavorite: false,
        sharedWith: [],
      });
  
      // Save folder and user
      await rootFolder.save();
      await newUser.save();
  
      // Create physical directory for user
      const userDir = path.join("uploads", "users", newUser._id.toString(), "My Drive");
      await fs.mkdir(userDir, { recursive: true });
  
      // Respond with user and folder data
      res.status(201).json({
        message: "User registered successfully",
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          storageLimit: newUser.storageLimit,
          usedStorage: newUser.usedStorage,
        },
        rootFolder: {
          _id: rootFolder._id,
          name: rootFolder.name,
          user: rootFolder.user,
          parentFolder: rootFolder.parentFolder,
          isFavorite: rootFolder.isFavorite,
          sharedWith: rootFolder.sharedWith,
        },
      });
    } catch (error) {
      console.error("Error in registration:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    } finally {
      console.log("Registration attempt finished.");
    }
  };

  exports.editUserInfo = async (req, res) => {
    const { username, email } = req.body;
    try {
      if (!username && !email) {
        return res.status(400).json({ message: "At least one field (username or email) is required" });
      }
      const updateFields = {};
      if (username) updateFields.username = username;
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateFields.email = email;
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, select: "-password" }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User info updated", user: updatedUser });
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Current password, new password, and confirm password are required" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match" });
      }
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Server error" });
    }
  };


exports.home = async (req, res) => {
  res.status(200).send(`

    Hello
    
    `);
};
