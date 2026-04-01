const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: '' },
  otpExpiry: { type: Date, default: null },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordTokenExpiry: { type: Date, default: null },
  currency: { type: String, default: '₹' },
  angelOne: {
    token: { type: String, default: '' },
    tokenExpiry: { type: Date, default: null },
    connected: { type: Boolean, default: false },
  }
});

module.exports = mongoose.model("User", UserSchema);
