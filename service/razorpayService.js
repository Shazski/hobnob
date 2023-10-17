const Razorpay = require("razorpay");
require("dotenv").config;
const instance = new Razorpay({
  key_id: process.env.RazoypayId,
  key_secret: process.env.RazorpaySecret,
});

module.exports = {
  generateRazorpay: (orderId, amount) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: amount * 100,
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(options, function (err, order) {
        resolve(order);
      });
    });
  },
};
