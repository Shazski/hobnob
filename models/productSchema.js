const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const ProductsSchema = new Schema({
  images: [{ type: String, required: true,  }],
  description: { type: String, required: true },
  name: { type: String, required: true },
  size: [{ type: String, required: true,  }],
  stock: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, required: true, ref: 'category' },
  brand: { type: String, required: true },
  offerPrice: { type: Number, required: true },
  gender: { type: String, required: true },
  status: { type: Boolean, required: true },
  color: { type: String, required: true },
  created: { type: String },
  updated:{type: String},
  offerExpiryDate:{type:Date}
});

module.exports = mongoose.model('Products', ProductsSchema);


