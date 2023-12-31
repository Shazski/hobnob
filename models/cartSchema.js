const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const UserCartSchema = new Schema({
  products: [
    {
      item: { type: Schema.Types.ObjectId, ref:"Products" },
      quantity: { type: Number },
      couponId: { type: Schema.Types.ObjectId },
      size: { type: String },
    },
  ],
  couponId: { type: Schema.Types.ObjectId },
  user: { type: Schema.Types.ObjectId },
  totalAmount: { type: Number },
});

module.exports = mongoose.model("UserCart", UserCartSchema);
