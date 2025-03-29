const express = require("express");
const router = express.Router();
const friendController = require("../controller/friendController");

router.post("/sendRequest", friendController.sendFriendRequest);
router.post("/acceptRequest", friendController.acceptFriendRequest);
router.post("/rejectRequest", friendController.rejectFriendRequest);
router.get("/requests/:userId", friendController.getFriendRequests);
router.get("/list/:userId", friendController.getFriends);

module.exports = router;
