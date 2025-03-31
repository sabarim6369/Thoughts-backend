const mongoose = require("mongoose");

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      votes: { type: Number, default: 0 },
    },
  ],
  votedUsers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      option: { type: Number, required: true },
    },
  ], 
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Poll", PollSchema);
