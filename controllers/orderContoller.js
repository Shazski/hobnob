const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Payment = require("../models/paymentSchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const cartHelper = require("../helpers/getCartAmount");
const paymentHelper = require("../helpers/paymentHelper");
const productHelper = require("../helpers/getProducts");
const generatePages = require("../service/pageGenerator");
module.exports = {
  getSuccess: (req, res) => {
    res.render("user/success", { user: req.session.user });
  },

  postOrder: async (req, res) => {
    const { address, paymentMethod, userId } = req.body;
    let userAddress = await User.findOne(
      { _id: userId },
      {
        _id: 0,
        addresses: { $elemMatch: { _id: address } },
      }
    );
    let cartProducts = await Cart.findOne(
      { user: userId },
      { "products._id": false }
    );
    if (cartProducts) {
      let total = await cartHelper.getTotalAmount(userId);
      const paymentStatus = paymentMethod === "cod" ? "placed" : "pending";
      await Order.create({
        paymentMode: paymentMethod,
        items: cartProducts.products,
        orderDate: new Date().toLocaleDateString(),
        customerId: userId,
        status: "pending",
        totalAmount: total[0].total,
        address: userAddress.addresses[0],
        couponId: cartProducts.couponId,
        paymentStatus: paymentStatus,
      });
      await Cart.findOneAndDelete({ user: userId });
      await paymentHelper.addPayment(userId, total[0].total, paymentMethod);

      for (const cartProduct of cartProducts.products) {
        const productId = cartProduct.item;
        const quantityToDecrement = cartProduct.quantity;
        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { stock: -quantityToDecrement } }
        );
        const product = await Product.findOne({_id:productId})
        if(product.stock === 0) {
          await Product.findOneAndUpdate(
            { _id: productId },
            { status: false}
          );
        }
      }
      res.redirect("/success");
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const status = req.query.status || "pending";
      const orderCount = await Order.find({ status: status }).count();
      const pages = generatePages.generatePageNumbers(orderCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const orderDetails = await Order.find({ status: status })
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      console.log(orderDetails);
      if (status === "pending") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          pending: true,
          pages,
          prevPage,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else if (status === "confirmed") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          confirmed: true,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else if (status === "shipped") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          shipped: true,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else if (status === "delivered") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          delivered: true,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else if (status === "canceled") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          canceled: true,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else if (status === "returned") {
        res.render("admin/viewOrder", {
          superAdmin: true,
          subAdmin: true,
          orderDetails,
          returned: true,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  getOrderDetails: async (req, res) => {
    const orderId = req.params.id;
    try {
      let orderDetails = await Order.findById(orderId).lean();
      if (orderDetails) {
        console.log(orderDetails);
        let productDetails = await productHelper.getProductsDetails(
          orderDetails._id
        );
        console.log(productDetails);
        let userDetails = await User.findById(orderDetails.customerId).lean();
        console.log(userDetails, "user");
        res.render("admin/orderDetails", {
          superAdmin: true,
          subAdmin: true,
          orderDetails: orderDetails,
          productDetails: productDetails,
          userDetails,
        });
      } else {
        res.redirect("/error");
      }
    } catch (error) {
      console.log(error);
    }
  },

  changeOrderStatus: async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    try {
      await Order.findOneAndUpdate({ _id: orderId }, { status: status });
      res.send("success").status(202);
    } catch (error) {
      console.log(error);
    }
  },

  getMyOrders: async (req, res) => {
    const userId = req.params.id;
    try {
      let orderCount = "";
      const status = req.query.status || "current";
      if (status === "current") {
        orderCount = await Order.find({
          customerId: userId,
          status: {
            $nin: ["delivered", "returned", "canceled"],
          },
        }).count();
      } else {
        orderCount = await Order.find({
          customerId: userId,
          status: {
            $in: ["delivered", "returned", "canceled"],
          },
        }).count();
      }
      const pages = generatePages.generatePageNumbers(orderCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      if (status === "current") {
        let orderDetails = await Order.find({
          customerId: userId,
          status: {
            $nin: ["delivered", "returned", "canceled"],
          },
        })
          .skip((page - 1) * 10)
          .limit(10)
          .lean();
        res.render("user/myOrders", {
          orderDetails,
          user: userId,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      } else {
        let orderDetails = await Order.find({
          customerId: userId,
          status: {
            $in: ["delivered", "returned", "canceled"],
          },
        })
          .skip((page - 1) * 10)
          .limit(10)
          .lean();
        res.render("user/myOrders", {
          orderDetails,
          user: userId,
          prevPage,
          pages,
          nextPage,
          hasPrev,
          hasNext,
          status,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  getMyOrderDetails: async (req, res) => {
    const orderId = req.params.id;
    try {
      let orderDetails = await Order.findById(orderId).lean();
      if (orderDetails) {
        let productDetails = await productHelper.getProductsDetails(
          orderDetails._id
        );
        let userDetails = await User.findById(orderDetails.customerId).lean();

          if(orderDetails.status !== "delivered") {

            res.render("user/myOrderDetails", {
              orderDetails: orderDetails,
              productDetails: productDetails,
              userDetails,
              cancel:true
            });
          } else {
            res.render("user/myOrderDetails", {
              orderDetails: orderDetails,
              productDetails: productDetails,
              userDetails,
              cancel:false
            });
          }
      } else {
        res.redirect("/error");
      }
    } catch (error) {
      console.log(error);
    }
  },

  postCancelReason: async(req, res) => {
    const orderId = req.params.id
    const { reason } = req.body
    try{
      let canceled =  await Order.updateOne({_id:orderId},{
        $set:{
          reason:reason,
          status:"canceled"
        }
      })
      let orderProducts = await Order.findOne({_id:orderId})
      for (const orderProduct of orderProducts.items) {
        const productId = orderProduct.item;
        const quantityToIncrement = orderProduct.quantity;
        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { stock: quantityToIncrement } }
        );
      }
      res.redirect(`/my-orders/${req.session.user._id}`)
    }catch(error) {
      console.log(error)
    }
  }

  
};
