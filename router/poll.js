const express = require("express");
const { createPoll, votePoll,getallpollofuser,getallpoll,sharePoll,getPollsByIds} = require("../controller/Poll");

const router = express.Router();

router.post("/create", createPoll);
router.post("/vote", votePoll);
router.post("/sharepoll", sharePoll);
router.get("/getPolls/:userId",getallpollofuser)
router.get("/getallPolls/:userId",getallpoll)
router.post("/getPollswithids",getPollsByIds);

module.exports = router;
