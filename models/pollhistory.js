const mongoose = require("mongoose");

const PollHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  poll: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  selectedOption: { type: String, required: true },
  votedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PollHistory", PollHistorySchema);
