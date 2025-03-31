const Poll = require("../models/pollschema");
const User=require("../models/userschema")
const mongoose = require("mongoose");

exports.createPoll = async (req, res) => {
  console.log(req.body)
  try {
    const { question, options,userId } = req.body;
    
    const newPoll = new Poll({
      question,
      options: options.map((option) => ({ text: option, votes: 0 })),
      createdBy:userId,
    });

    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { pollId, userId, optionIndex } = req.body;
    const poll = await Poll.findById(pollId);

    if (!poll) return res.status(404).json({ message: "Poll not found" });

    // Check if user has already voted
    if (poll.votedUsers.includes(userId)) {
      return res.status(400).json({ message: "You have already voted on this poll" });
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option" });
    }

    poll.options[optionIndex].votes += 1;
    poll.votedUsers.push(userId); // Add user to voted list

    await poll.save();
    const pollOwner = await User.findById(poll.createdBy);
    if (pollOwner) {
      pollOwner.notifications.push({
        type: "vote",
        message: `Someone voted on your poll: "${poll.question}"`,
        fromUser: userId,
        pollId: pollId,
      });
      await pollOwner.save();
    }
    res.status(200).json({ message: "Vote recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

  exports.getallpollofuser= async (req, res) => {
    try {
        const userId = req.params.userId;

        const polls = await Poll.find({ createdBy: userId });
        res.status(200).json(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
        res.status(400).json({ message: "Error fetching polls." });
    }
  };
exports.getallpoll = async (req, res) => {
    console.log("Fetching polls...");
    try {
        const userId = req.params.userId;
        console.log("User ID:", userId);

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const polls = await Poll.find({ createdBy: { $ne: userObjectId } })
            .populate('createdBy', '_id username email phoneNumber dob friends profilePic');
console.log("❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥❤️‍🔥")
        console.log(polls);

        const profileImages = [
            "https://randomuser.me/api/portraits/women/1.jpg",
            "https://randomuser.me/api/portraits/men/1.jpg",
            "https://randomuser.me/api/portraits/women/2.jpg",
        ];

        const formattedPolls = polls.map(poll => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

            const userVotedOptionIndex = poll.votedUsers.includes(userObjectId) 
                ? poll.options.findIndex(option => option.votes > 0) 
                : -1; // If the user has not voted, set -1

            // Process poll options with percentages and mark voted option
            const optionsWithVotes = poll.options.map((option, index) => ({
              text: option.text,
              votes: option.votes, // Set total votes instead of percentage
              marked: index === userVotedOptionIndex // Mark option if user voted
            }));
            const randomProfileImage = profileImages[Math.floor(Math.random() * profileImages.length)];

            return {
                id: poll._id.toString(),
                user: poll.createdBy.username,
                question: poll.question,
                options: optionsWithVotes,
                profileImage: randomProfileImage,
                userid: poll.createdBy._id
            };
        });

        console.log(JSON.stringify(formattedPolls, null, 2));
        res.status(200).json(formattedPolls);
    } catch (err) {
        console.error("Error fetching polls:", err);
        res.status(500).json({ message: "Error fetching polls." });
    }
};

exports.sharePoll = async (req, res) => {
  console.log(req.body);
  
  try {
    const { userId, friends, pollId } = req.body;

    if (!userId || !friends || !pollId || !Array.isArray(friends) || friends.length === 0) {
      return res.status(400).json({ message: "Missing or invalid required fields." });
    }

    // Check if the poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Check if all friends exist
    const validFriends = await User.find({ _id: { $in: friends } });
    if (validFriends.length !== friends.length) {
      return res.status(404).json({ message: "One or more friends not found" });
    }

    // Share the poll with all valid friends
    await Promise.all(
      friends.map(friendId =>
        User.findByIdAndUpdate(friendId, {
          $push: { sharedPolls: { pollId, sharedPersonId: userId } }
        })
      )
    );

    res.status(200).json({ message: "Poll shared successfully with all friends." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getPollsByIds = async (req, res) => {
  console.log("😍😍😍😍",req.body)
  try {
    const { friendId, userId } = req.body; // Receive friendId and userId

    if (!friendId || !userId) {
      return res.status(400).json({ message: "Friend ID and User ID are required." });
    }

    const user = await User.findById(userId).populate("sharedPolls.pollId");

    if (!user) {
      console.log("🐦‍🔥🐦‍🔥🐦‍🔥")
      return res.status(404).json({ message: "User not found." });
    }

    // Step 2: Filter sharedPolls where `sharedPersonId` matches `friendId`
    const sharedPollsByFriend = user.sharedPolls.filter(
      (shared) => shared.sharedPersonId.toString() === friendId
    );

    if (!sharedPollsByFriend.length) {
      console.log("🚬🚬🚬🚬🚬")
      return res.status(404).json({ message: "No polls shared by this friend." });
    }

    // Step 3: Extract pollIds
    const pollIds = sharedPollsByFriend.map((shared) => shared.pollId._id);

    // Step 4: Fetch actual polls using pollIds
    const polls = await Poll.find({ _id: { $in: pollIds } }).populate(
      "createdBy",
      "_id username email phoneNumber dob friends"
    );

    if (!polls.length) {
      return res.status(404).json({ message: "No polls found for the provided friend." });
    }

    // Step 5: Format response
    const formattedPolls = polls.map((poll) => {
      const userVotedOptionIndex =
        userId && poll.votedUsers.includes(userId)
          ? poll.options.findIndex((option) => option.votes > 0)
          : -1;

      const optionsWithVotes = poll.options.map((option, index) => ({
        text: option.text,
        votes: option.votes,
        marked: index === userVotedOptionIndex, // Mark option if user voted
      }));

      return {
        id: poll._id.toString(),
        user: poll.createdBy.username,
        question: poll.question,
        options: optionsWithVotes,
        createdBy: poll.createdBy._id,
        userid:poll.createdBy._id
      };
    });

    res.status(200).json({ polls: formattedPolls });
  } catch (err) {
    console.error("Error fetching polls shared by friend:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Remove the poll from sharedPolls in all users
    await User.updateMany(
      { "sharedPolls.pollId": pollId },
      { $pull: { sharedPolls: { pollId } } }
    );

    // Delete the poll itself
    await Poll.findByIdAndDelete(pollId);

    res.status(200).json({ message: "Poll deleted successfully" });
  } catch (err) {
    console.error("Error deleting poll:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getSharedPolls = async (req, res) => {
  try {
      const { userId } = req.params;

      const user = await User.findById(userId)
          .populate({
              path: "sharedPolls.pollId sharedPolls.sharedPersonId",
              select: "title question sharedAt username email"
          });

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      console.log("👼👼👼👼👼 Before filtering");
      console.log(user.sharedPolls);

      // Remove duplicates based on sharedPersonId
      const uniqueSharedPolls = user.sharedPolls.filter((poll, index, self) =>
          index === self.findIndex((p) => p.sharedPersonId.equals(poll.sharedPersonId))
      );

      console.log("😍😍😍😍😍 After filtering");
      console.log(uniqueSharedPolls);

      res.status(200).json({ sharedPolls: uniqueSharedPolls });
  } catch (error) {
      console.error("Error fetching shared polls:", error);
      res.status(500).json({ message: "Error fetching shared polls", error });
  }
};
