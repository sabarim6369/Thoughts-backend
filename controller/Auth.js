const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userschema");
const nodemailer = require("nodemailer");

const otpStorage = new Map(); // Temporary storage for OTPs
exports.signup = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

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
    user: "sabarim6369@gmail.com",
    pass: "yifi jcyj uawz wmdv",
  },
});

exports.sendOTP = async (req, res) => {
  console.log(req.body)
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
console.log("hello",req.body)
    // if (!user) {
    //   console.log("nouser")
    //   return res.status(404).json({ message: "User not found" });
    // }
    console.log("1")

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, otp);
    console.log("2")

    const mailOptions = {
      from: "sabarim6369@gmail.com",
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("suiccess")
    res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Error sending OTP. Try again later." });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!otpStorage.has(email) || otpStorage.get(email) !== otp) {
      return res.status(400).json({ error: "Invalid OTP or expired." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    otpStorage.delete(email);
    res.status(200).json({ success: true, message: "Password reset successfully!" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: "Error verifying OTP. Try again later." });
  }
};
