const User = require("../models/userschema"); // Replace with the correct path
const Poll = require("../models/pollschema");

exports.sendFriendRequest = async (req, res) => {
  console.log(req.body)
  try {
      const { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
          return res.status(400).json({ message: "Sender and receiver IDs are required" });
      }
      if (senderId === receiverId) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself" });
      }
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
      console.log(sender,receiver)

      if (!sender || !receiver) {
          return res.status(404).json({ message: "User not found" });
      }
console.log("first")
      if (receiver.friends.some(id => id.toString() === senderId)) {
          return res.status(400).json({ message: "Already friends" });
      }
console.log("second")
      if (receiver.friendRequests.some(id => id.toString() === senderId)) {
          return res.status(400).json({ message: "Request already sent" });
      }
      console.log("second")
      receiver.friendRequests.push(senderId);
      await receiver.save();

      res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error sending friend request", error });
  }
};

exports.unfollowFriend = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({ message: "Sender and receiver IDs are required" });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!receiver.friends.includes(senderId)) {
            return res.status(400).json({ message: "Not friends" });
        }

        receiver.friends = receiver.friends.filter(id => id.toString() !== senderId);
        await receiver.save();

        // Remove receiverId from sender's friends list
        sender.friends = sender.friends.filter(id => id.toString() !== receiverId);
        await sender.save();

        res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error unfollowing friend", error });
    }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
      const { userId, requesterId } = req.body;
      console.log(req.body);

      const user = await User.findById(userId);
      const requester = await User.findById(requesterId);

      if (!user || !requester) {
          return res.status(404).json({ message: "User not found" });
      }

      if (!user.friendRequests.includes(requesterId)) {
          return res.status(400).json({ message: "No friend request found" });
      }
      if (user.friends.includes(requesterId)) {
        return res.status(400).json({ message: "Already friends" });
    }
      user.friends.push(requesterId);
      requester.friends.push(userId);

      user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);

      await user.save();
      await requester.save();

      res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
      res.status(500).json({ message: "Error accepting friend request", error });
  }
};

// Reject Friend Request
exports.rejectFriendRequest = async (req, res) => {
  try {
      const { userId, requesterId } = req.body;

      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Remove request
      user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
      await user.save();

      res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
      res.status(500).json({ message: "Error rejecting friend request", error });
  }
};

// Get Friend Requests
exports.getFriendRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(req.params);
        
        const user = await User.findById(userId)
          .populate("friendRequests", "username email")
          .populate("notifications.fromUser", "username") // Populate fromUser for notifications
          .populate("notifications.pollId", "title"); // Optional: Populate poll details
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        // Format friend requests
        const friendRequests = user.friendRequests.map(request => ({
          id: request._id,
          type: "friendRequest",
          user: request.username,
          message: "sent you a friend request",
          status: "pending",
          requesterId: request._id,
        }));
    
        // Format notifications
        const notifications = user.notifications
          .filter((notification) => !notification.isRead) // Get only unread notifications
          .map((notification) => ({
            id: notification._id,
            type: notification.type,
            message: notification.message,
            fromUser: notification.fromUser?.username || "Unknown",
            pollId: notification.pollId ? notification.pollId._id : null,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
          }));

    
        res.status(200).json({ friendRequests, notifications });
      } catch (error) {
        res.status(500).json({ message: "Error fetching data", error });
      }
  };
  
exports.getFriends = async (req, res) => {
    console.log("😍 Fetching Friends List 😍");
    try {
        const { userId } = req.params;
        console.log(req.params);

        const user = await User.findById(userId)
            .populate({
                path: "friends",
                select: "username email sharedPolls profilePic _id",
                populate: {
                    path: "sharedPolls.pollId sharedPolls.sharedPersonId", // Populate poll details & shared person
                    select: "title question sharedAt username email" // Customize fields
                }
            });

        // console.log(user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Separate friends who have sharedPolls
        const friendsWithSharedPolls = user.friends.filter(friend => friend.sharedPolls.length > 0);
        // console.log("😍😍😍😍😍",friendsWithSharedPolls)
        const totalPolls = await Poll.countDocuments({ createdBy: userId });
console.log("🤮🤮🤮",totalPolls)
        res.status(200).json({
            friends: user.friends, 
            friendsWithSharedPolls,  
            user,
            totalPolls
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching friends list", error });
    }
};
exports.getSuggestedFriends = async (req, res) => {
    console.log("🔍 Fetching Suggested Friends 🔍");
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate("friends", "id");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);

        const suggestedFriends = await User.find({
            _id: { $nin: [...friendIds, userId] }, 
        }).select("username email profilePic friendRequests");

        // Add 'requested' flag if userId is in their friendRequests array
        const formattedSuggestedFriends = suggestedFriends.map(friend => ({
            ...friend.toObject(),
            requested: friend.friendRequests.includes(userId)
        }));

        console.log("✅ Suggested Friends:", formattedSuggestedFriends);
        res.status(200).json({ suggestedFriends: formattedSuggestedFriends });
    } catch (error) {
        res.status(500).json({ message: "Error fetching suggested friends", error });
    }
};

exports.chat = async (req, res) => {
    try {
      const { userId, chatWith, message } = req.body;
  
      console.log(req.body);
  
      if (!userId || !chatWith || !message.trim()) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Find user and check if chat exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if chat exists in user's chat list
      let chatExists = user.chats.some(chat => chat.chatWith.toString() === chatWith);
  
      if (chatExists) {
        // 🔹 Update existing chat with new message
        await User.findOneAndUpdate(
          { _id: userId, "chats.chatWith": chatWith },
          {
            $push: { "chats.$.messages": { text: message, createdAt: new Date(), isRead: false } },
          },
          { new: true }
        );
      } else {
        // 🔹 Create new chat entry
        await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              chats: {
                chatWith,
                messages: [{ text: message, createdAt: new Date(), isRead: false }],
              },
            },
          },
          { new: true }
        );
      }
  
      res.status(200).json({ message: "Message added successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  exports.getChat = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        console.log("Received request:", req.body);

        if (!userId || !friendId) {
            console.log("Missing userId or friendId");
            return res.status(400).json({ error: "User ID and Friend ID are required" });
        }

        // Find user's chat with friend (sent messages)
        const user = await User.findById(userId).populate("chats.chatWith");
        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({ error: "User not found" });
        }

        const userChat = user.chats.find(chat => chat.chatWith?.toString() === friendId);
        const sentMessages = userChat 
            ? userChat.messages.map(msg => ({
                ...msg._doc, 
                sentBy: userId,
                text: msg.text,
                createdAt: msg.createdAt,
                messageType: "sent"
            }))
            : [];

        // Find friend's chat with user (received messages)
        const friend = await User.findById(friendId).populate("chats.chatWith");
        if (!friend) {
            console.log("Friend not found:", friendId);
            return res.status(404).json({ error: "Friend not found" });
        }

        const friendChat = friend.chats.find(chat => chat.chatWith?.toString() === userId);
        const receivedMessages = friendChat 
            ? friendChat.messages.map(msg => ({
                ...msg._doc, 
                sentBy: friendId,
                text: msg.text,
                createdAt: msg.createdAt,
                messageType: "received"
            }))
            : [];

        const chatMessages = [...receivedMessages, ...sentMessages].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        console.log("Total messages:", chatMessages.length);
        res.status(200).json({ messages: chatMessages ?? [] }); // Ensure it always returns an array

    } catch (error) {
        console.error("Error in getChat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

  exports.cancelFriendRequest = async (req, res) => {
    try {
      const { senderId, receiverId } = req.body;
  
      await User.findByIdAndUpdate(receiverId, {
        $pull: { friendRequests: senderId },
      });
  
      res.status(200).json({ message: "Friend request canceled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error canceling friend request", error });
    }
  };
  