const mongoose = require("mongoose");

const newUser = mongoose.Schema({
  _id: String,
  blocked:{
    type: Boolean,
    default: false,
  } ,
  name: String,
  email: String,
  password: String,
  city: String,
  isEmployee: Boolean,
  date: {
    type: Date,
    default: Date.now,
  },
  postSave: [],
  profileImg: String,
  file: String,
  messages: [
    {
      from: String,
      content: String,
      seen: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("user", newUser);
