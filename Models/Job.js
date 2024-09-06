const mongoose = require("mongoose");

const JobPost = mongoose.Schema({
  id: String,
  user: String,
  title: String,
  date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  category: String,
  type:String,
  location:String,
  salary:Number,
  photo:String,
  likes:Number
});

module.exports = mongoose.model("jobpost", JobPost);
