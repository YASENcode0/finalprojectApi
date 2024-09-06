const mongoose = require("mongoose");

const JobUser = mongoose.Schema({
  postId: String,
  userId:{
    type:String,
    ref:'user'
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("JobUser", JobUser);
