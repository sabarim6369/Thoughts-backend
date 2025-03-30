const express = require("express");
const { signup, login,editdetails,sendOTP,verifyOTP,deleteaccount } = require("../controller/Auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/edit", editdetails);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/deleteaccount", deleteaccount);
module.exports = router;
