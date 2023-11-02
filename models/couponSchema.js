const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const CouponsSchema = new Schema({
  minAmount: { type: Number },
  maxAmount: { type: Number },
  couponName: { type: String,unique:true },
  discountAmount: { type: Number },
  expiryDate: { type: Date },
  created: { type: String },
  userId: [{ type: Schema.Types.ObjectId}],
});

module.exports = mongoose.model("Coupons", CouponsSchema);
