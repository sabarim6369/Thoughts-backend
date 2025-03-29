const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userschema");

exports.signup = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, dob } = req.body;

    if (!username || !email || !password || !phoneNumber || !dob) {
      return res.status(400).json({ error: "Please provide all fields." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      dob,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error during signup:", err);  // Log the error to the server console

    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const expiresIn = rememberMe ? "5d" : "1d"; 
    const token = jwt.sign({ userId: user._id }, "secretkey", { expiresIn });

    res.status(200).json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.editdetails = async (req, res) => {
  try {
    const { userId } = req.body; // Accepting userId from the request body
    const { username, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    if (!username && !bio) {
      return res.status(400).json({ error: "Please provide at least one field to update." });
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
