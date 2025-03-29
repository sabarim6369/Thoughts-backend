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
        res.status(500).json({ message: "Error fetching polls." });
    }
  };
exports.getallpoll = async (req, res) => {
    console.log("Fetching polls...");
    try {
        const userId = req.params.userId;
        console.log("User ID:", userId);

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const polls = await Poll.find({ createdBy: { $ne: userObjectId } })
            .populate('createdBy', '_id username email phoneNumber dob friends');

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
            const optionsWithPercentages = poll.options.map((option, index) => {
                const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(2) : 0;
                return {
                    text: option.text,
                    votes: percentage,
                    marked: index === userVotedOptionIndex // Mark option if user voted
                };
            });

            const randomProfileImage = profileImages[Math.floor(Math.random() * profileImages.length)];

            return {
                id: poll._id.toString(),
                user: poll.createdBy.username,
                question: poll.question,
                options: optionsWithPercentages,
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
  console.log(req.body);
  try {
    const { pollIds, userId } = req.body; // Ensure userId is passed to check if the user voted

    if (!pollIds || !Array.isArray(pollIds) || pollIds.length === 0) {
      return res.status(400).json({ message: "Invalid or missing poll IDs." });
    }

    const polls = await Poll.find({ _id: { $in: pollIds } }).populate(
      "createdBy",
      "_id username email phoneNumber dob friends"
    );

    if (!polls.length) {
      return res.status(404).json({ message: "No polls found for the provided IDs." });
    }

    const formattedPolls = polls.map(poll => {
      const userVotedOptionIndex = userId && poll.votedUsers.includes(userId) 
        ? poll.options.findIndex(option => option.votes > 0) 
        : -1; 

      const optionsWithVotes = poll.options.map((option, index) => ({
        text: option.text,
        votes: option.votes, // Set total votes instead of percentage
        marked: index === userVotedOptionIndex // Mark option if user voted
      }));

      console.log(optionsWithVotes);

      return {
        id: poll._id.toString(),
        user: poll.createdBy.username,
        question: poll.question,
        options: optionsWithVotes,
        createdBy: poll.createdBy._id,
        userid: poll.createdBy._id
      };
    });

    console.log(formattedPolls);
    res.status(200).json({ polls: formattedPolls });
  } catch (err) {
    console.error("Error fetching polls by IDs:", err);
    res.status(500).json({ error: err.message });
  }
};
