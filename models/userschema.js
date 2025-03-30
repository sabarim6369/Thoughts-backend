const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  dob: { type: Date },
  bio:{type:String},
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  sharedPolls: [{
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll" }, 
    sharedPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    sharedAt: { type: Date, default: Date.now } 
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
