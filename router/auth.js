const express = require("express");
const { signup, login,editdetails,sendOTP,verifyOTP,deleteaccount,changePassword,uploadProfilePic,uploadMiddleware,resetPassword } = require("../controller/Auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/edit", editdetails);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/deleteaccount", deleteaccount);
router.post("/change-password", changePassword);
router.post("/upload-profile-pic",uploadMiddleware, uploadProfilePic);
router.post("/reset-password", resetPassword);

module.exports = router;
