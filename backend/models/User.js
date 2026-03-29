const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  angelOne: {
    token: { type: String, default: '' },
    tokenExpiry: { type: Date, default: null },
    connected: { type: Boolean, default: false },
  }
});

module.exports = mongoose.model("User", UserSchema);
