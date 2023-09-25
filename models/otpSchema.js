const mongoose = require('mongoose');

const { Schema } = mongoose;

const OtpSchema = new Schema({
  Email: { type: String, required: true, unique: true },
  Otp: { type: Number, required: true },
});

const Otp = mongoose.model('Otp', OtpSchema);

module.exports = Otp;

