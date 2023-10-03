const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const PaymentSchema = new Schema({

     payments: [{
        payment: {
           amount: { type: Number },
           paymentDate: { type: String },
           paymentMode: { type: String },
  }
  }],
     user: { type: Schema.Types.ObjectId },
});

module.exports = mongoose.model('Payment', PaymentSchema);



