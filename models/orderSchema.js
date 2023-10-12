const mongoose = require("mongoose");

const { Schema, ObjectId } = mongoose;

const OrdersSchema = new Schema({
  paymentMode: { type: String, required: true },
  items: [
    {
      item: { type: Schema.Types.ObjectId },
      quantity: { type: Number },
      size: { type: String },
    },
  ],
  orderDate: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, required: true },
  status: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  deliveryDate: { type: String },
  address: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
  },
  couponId: { type: Schema.Types.ObjectId },
  paymentStatus: { type: String },
  reason: {type:String},
  updatedAt:{type:Date},
  returnDate:{type:Date}
});

module.exports = mongoose.model("Orders", OrdersSchema);
