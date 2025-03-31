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
      console.log(req.params)
      const user = await User.findById(userId).populate("friendRequests", "username email");

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ friendRequests: user.friendRequests });
  } catch (error) {
      res.status(500).json({ message: "Error fetching friend requests", error });
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
                select: "username email sharedPolls",
                populate: {
                    path: "sharedPolls.pollId sharedPolls.sharedPersonId", // Populate poll details & shared person
                    select: "title question sharedAt username email" // Customize fields
                }
            });

        console.log(user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Separate friends who have sharedPolls
        const friendsWithSharedPolls = user.friends.filter(friend => friend.sharedPolls.length > 0);
        console.log("😍😍😍😍😍",friendsWithSharedPolls)
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
      }).select("username email avatar");

      console.log("✅ Suggested Friends:", suggestedFriends);
      res.status(200).json({ suggestedFriends });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching suggested friends", error });
    }
};
