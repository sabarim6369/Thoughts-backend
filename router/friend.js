const express = require("express");
const router = express.Router();
const friendController = require("../controller/friendcontroller");

router.post("/sendRequest", friendController.sendFriendRequest);
router.post("/unfollow", friendController.unfollowFriend);
router.post("/acceptRequest", friendController.acceptFriendRequest);
router.post("/rejectRequest", friendController.rejectFriendRequest);
router.get("/requests/:userId", friendController.getFriendRequests);
router.get("/list/:userId", friendController.getFriends);
router.get("/suggestedfriendlist/:userId", friendController.getSuggestedFriends);

module.exports = router;
