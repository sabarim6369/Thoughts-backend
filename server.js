const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./router/auth");
const pollRoutes = require("./router/poll");
const friendRoutes = require("./router/friend");
const reportroutes=require("./router/report")
dotenv.config();

const app = express();

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(cors());

app.use("/auth", authRoutes);
app.use("/poll", pollRoutes);
app.use("/friend", friendRoutes);
app.use("/report",reportroutes);

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));
  })
  .catch((err) => console.log(err));
