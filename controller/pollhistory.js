const PollHistory = require("../models/pollhistory");

exports.getUserPollHistory = async (req, res) => {
  try {
    const history = await PollHistory.find({ user: req.user.userId }).populate("poll");
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
