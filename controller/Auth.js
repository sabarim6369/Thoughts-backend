const express = require("express");
const app = express();
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userschema");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadMiddleware = upload.single("profilePic");

// const otpStorage = new Map(); 
exports.signup = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    console.log(req.body)

    if (!username || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: "Please provide all fields." });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already exists. Please choose another." });
      }
      if (existingUser.email === email) {
        if (existingUser.status === "active") {
          return res.status(400).json({ error: "Email already exists. Please log in." });
        } else {
          existingUser.username = username;
          existingUser.password = await bcrypt.hash(password, 10);
          existingUser.phoneNumber = phoneNumber;
          existingUser.status = "active";

          existingUser.friends = [];
          existingUser.friendRequests = [];
          existingUser.sharedPolls = [];

          await existingUser.save();
          return res.status(200).json({ message: "Account reactivated successfully." });
        }
      }
    }

    // If user does not exist, create a new one
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      status: "active", // Default status is active
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    console.error("Error during signup:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: "Duplicate key error: This username or email already exists." });
    }
    
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });

    // If the user is not found or is inactive, return "User not found" for security reasons
    if (!user || user.status !== "active") {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: "User not found" });
    }

    const expiresIn = rememberMe ? "5d" : "1d";
    const token = jwt.sign({ userId: user._id }, "secretkey", { expiresIn });

    res.status(200).json({ token, userId: user._id });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deleteaccount = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: "inactive" }, // Setting status to inactive instead of deleting
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Account deactivated successfully." });
  } catch (err) {
    console.error("Error deactivating account:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.editdetails = async (req, res) => {
  try {
    const { userId } = req.body;
    const { username, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    if (!username && !bio) {
      return res.status(400).json({ error: "Provide at least one field to update." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { ...(username && { username }), ...(bio && { bio }) } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ================= OTP RESET PASSWORD FLOW =================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hellothogts@gmail.com",
    pass: "vmew pknr fqvb gepi",
  },
});
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    


    const mailOptions = {
      from: "sabarim6369@gmail.com",
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "OTP sent successfully.", otp });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return res.status(500).json({ success: false, message: "Error sending OTP. Try again later." });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // const otpDetails = otpStorage.get(email);
    if (!otpDetails) {
      return res.status(400).json({ error: "OTP not sent." });
    }

    // Check if OTP exists and matches
    if (otpDetails.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    // Check if OTP has expired
    if (Date.now() > otpDetails.expiresAt) {
      // otpStorage.delete(email); // Clean up expired OTP
      return res.status(400).json({ error: "OTP expired." });
    }

    // OTP is valid and not expired, so delete it from storage
    // otpStorage.delete(email);

    res.status(200).json({ success: true, message: "OTP verified successfully!" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: "Error verifying OTP. Try again later." });
  }
};



exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, userId } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Both old and new passwords are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect old password." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({ error: "Internal Server Error. Please try again later." });
  }
};
app.use(express.urlencoded({ extended: true }));
const streamifier = require("streamifier");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profile_pics" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.uploadProfilePic = async (req, res) => {
  console.log("😶‍🌫️😶‍🌫️😶‍🌫️😶‍🌫️😶‍🌫️😶‍🌫️😶‍🌫️")
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.body.userId;
    const buffer = req.file.buffer;

    const imageUrl = await uploadToCloudinary(buffer);

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePic: imageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile picture updated", profilePic: user.profilePic });

  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};




exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email  || !newPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully!" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Internal Server Error. Please try again later." });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId, userId } = req.body;

    // Find the user
    console.log(req.body)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the notification in the user's notifications array
    const notification = user.notifications.find(
      (notif) => notif._id.toString() === notificationId
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark as read
    notification.isRead = true;

    // Save the user document
    await user.save();

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
