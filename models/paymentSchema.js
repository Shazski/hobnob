const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const PaymentSchema = new Schema({
  UserPayment: {
     Payments: [{
        Payment: {
           Amount: { type: Number },
           PaymentDate: { type: String },
           PaymentMethod: { type: String },
  },
  }],
     UserId: { type: Schema.Types.ObjectId },
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);



