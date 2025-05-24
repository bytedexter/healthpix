const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  phonenumber: String,
  password: String,
});
const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
