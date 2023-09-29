const User = require("../models/userSchema");
const Payment = require("../models/paymentSchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const cartHelper = require('../helpers/getCartAmount')
module.exports = {
  postPayment: async (req, res) => {
    const { address, paymentMethod, userId } = req.body;
    console.log(paymentMethod,"method")
    let userAddress = await User.findOne(
      { _id: userId },
      {
        _id: 0,
        addresses: { $elemMatch: { _id: address } },
      }
    )
    console.log(userAddress.addresses)
    let cartProducts =await Cart.findOne({user:userId},{'products._id':false})
    let total = await cartHelper.getTotalAmount(userId);
    console.log(cartProducts)
    await Order.create({
        paymentMode: paymentMethod,
        items:cartProducts.products,
        orderDate:new Date().toLocaleDateString(),
        customerId: userId,
        status:"pending",
        totalAmount:total[0].total,
        address:userAddress.addresses[0],
        couponId:cartProducts.couponId
    })
    res.redirect('/cart')
  }
};
