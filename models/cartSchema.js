const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const UserCartSchema = new Schema({
     products: [{
           item: { type: Schema.Types.ObjectId },
           quantity: { type: Number },
  }],
     user: { type: Schema.Types.ObjectId },
});

module.exports = mongoose.model('UserCart', UserCartSchema);


