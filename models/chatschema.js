const mongoose=require("mongoose");
const ChatSchema = new mongoose.Schema({
    chatWith: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Friend's ID
    messages: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false },
      },
    ],
  });