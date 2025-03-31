const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  dob: { type: Date },
  bio:{type:String},
  profilePic: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  sharedPolls: [{
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll" }, 
    sharedPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    sharedAt: { type: Date, default: Date.now } 
  }],
  notifications: [
    {
      type: { type: String, enum: ["vote", "friendRequest", "message"] },
      message: { type: String },
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", default: null },
      createdAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
