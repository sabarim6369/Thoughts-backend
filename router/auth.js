const express = require("express");
const { signup, login,editdetails } = require("../controller/Auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/edit", editdetails);

module.exports = router;
