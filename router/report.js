const express = require("express");
const {sendreport}=require("../controller/Report")
const router = express.Router();
router.post("/submit", sendreport);
module.exports=router