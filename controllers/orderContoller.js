require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Payment = require("../models/paymentSchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const invoiceHelper = require('../service/invoice')
const cartHelper = require("../helpers/getCartAmount");
const paymentHelper = require("../helpers/paymentHelper");
const productHelper = require("../helpers/getProducts");
const generatePages = require("../service/pageGenerator");
const razorpayHelper = require("../service/razorpayService");
const userSchema = require("../models/userSchema");
module.exports = {
  getSuccess: (req, res) => {
    res.render("user/success", { user: req.session.user });
  },

  postOrder: async (req, res) => {
    console.log(req.body, "body of order details");
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
      const total = await Cart.findOne(
        { user: req.session.user._id },
        {
          _id: false,
          totalAmount: true,
        }
      ).lean();
      const paymentStatus = paymentMethod === "cod" ? "placed" : "pending";
      if(paymentMethod !== "wallet") {
        let orderDetails = await Order.create({
          paymentMode: paymentMethod,
          items: cartProducts.products,
          orderDate: new Date().toLocaleDateString(),
          customerId: userId,
          status: "pending",
          totalAmount: total.totalAmount,
          address: userAddress.addresses[0],
          couponId: cartProducts.couponId,
        paymentStatus: paymentStatus,
      }); 
    }
      await paymentHelper.addPayment(userId, total.totalAmount, paymentMethod);

      for (const cartProduct of cartProducts.products) {
        const productId = cartProduct.item;
        const quantityToDecrement = cartProduct.quantity;
        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { stock: -quantityToDecrement } }
        );
        const product = await Product.findOne({ _id: productId });
        if (product.stock === 0) {
          await Product.findOneAndUpdate({ _id: productId }, { status: false });
        }
      }
      if (paymentMethod === "cod") {
        await Cart.findOneAndDelete({ user: userId });
        res.json({ cod: true });
      } else if (paymentMethod === "online") {
        let response = await razorpayHelper.generateRazorpay(
          orderDetails._id,
          total.totalAmount
        );
        let paymentRes = {
          response: response,
          order: orderDetails,
          user: req.session.user,
        };
        res.json({ paymentRes });
        await Cart.findOneAndDelete({ user: userId });
      } else if (paymentMethod === "wallet") {
        console.log(req.body, "wallet worked");
        let userWallet = await User.findOne(
          { _id: req.session.user._id },
          { _id: false, wallet: true }
        );
        console.log(userWallet.wallet,total.totalAmount);
        if (userWallet.wallet >= total.totalAmount) {
          await User.findOneAndUpdate(
            { _id: req.session.user._id },
            {
              $inc: {
                wallet: -total.totalAmount,
              },
            }
          );
          let orderDetails = await Order.create({
            paymentMode: paymentMethod,
            items: cartProducts.products,
            orderDate: new Date().toLocaleDateString(),
            customerId: userId,
            status: "pending",
            totalAmount: total.totalAmount,
            address: userAddress.addresses[0],
            couponId: cartProducts.couponId,
          paymentStatus: paymentStatus,
        }); 
        await Order.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(orderDetails._id) },
          { paymentStatus: "placed" }
        );
          res.json({ wallet: true });
          await Cart.findOneAndDelete({ user: userId });
        } else {
          console.log("error happend");
          res.json({walletError:true,error:"wallet amount is less than total amount"});
        }
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const status = req.query.status || "pending";
      const sortData = req.query.sort || "orderDate";
      const orderCount = await Order.find({ status: status }).count();
      const pages = generatePages.generatePageNumbers(orderCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const orderDetails = await Order.find({ status: status })
        .skip((page - 1) * 10)
        .sort(sortData)
        .limit(10)
        .sort({ orderDate: -1 })
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
          sortData,
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
          sortData,
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
          sortData,
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
          sortData,
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
          sortData,
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
          sortData,
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
    console.log(status, "status");
    const orderId = req.params.id;
    try {
      const currentDate = new Date();
      const futureDate = new Date(currentDate);
      futureDate.setMinutes(currentDate.getMinutes() + 30);
      await Order.findOneAndUpdate(
        { _id: orderId },
        { status: status, updatedAt: new Date() }
      );
      await Order.findOneAndUpdate(
        { _id: orderId, status: "delivered" },
        {
          returnDate: futureDate,
        }
      );
      res.send("success").status(202);
    } catch (error) {
      console.log(error);
    }
  },

  getMyOrders: async (req, res) => {
    const userId = req.params.id;
    const sortData = req.query.sort || "";
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
          .sort(sortData)
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
          sortData,
        });
      } else {
        let orderDetails = await Order.find({
          customerId: userId,
          status: {
            $in: ["delivered", "returned", "canceled"],
          },
        })
          .sort(sortData)
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
          sortData,
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
      console.log(orderDetails, "orderdetails of user");
      if (orderDetails) {
        let productDetails = await productHelper.getProductsDetails(
          orderDetails._id
        );
        let userDetails = await User.findById(orderDetails.customerId).lean();

        if (orderDetails.status === "canceled") {
          console.log("cancel product worked");
          res.render("user/myOrderDetails", {
            orderDetails: orderDetails,
            productDetails: productDetails,
            userDetails,
            canceled: true,
            user: req.session.user,
          });
        } else if (orderDetails.status !== "delivered") {
          res.render("user/myOrderDetails", {
            orderDetails: orderDetails,
            productDetails: productDetails,
            userDetails,
            cancel: true,
            user: req.session.user,
          });
        } else {
          let returned;
          if (new Date() >= orderDetails.returnDate) {
            returned = false;
          } else {
            returned = true;
          }
          res.render("user/myOrderDetails", {
            orderDetails: orderDetails,
            productDetails: productDetails,
            userDetails,
            returned,
            user: req.session.user,
          });
        }
      } else {
        res.redirect("/error");
      }
    } catch (error) {
      console.log(error);
    }
  },

  postCancelReason: async (req, res) => {
    const orderId = req.params.id;
    const { reason } = req.body;
    try {
      let canceled = await Order.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            reason: reason,
            status: "canceled",
          },
        }
      );
      let totalAmount = canceled.totalAmount;
      if (canceled.paymentMode === "online" || canceled.paymentMode === "wallet") {
        await userSchema.findByIdAndUpdate(req.session.user._id, {
          $inc: { wallet: totalAmount },
        });
      }
      let orderProducts = await Order.findOne({ _id: orderId });
      for (const orderProduct of orderProducts.items) {
        const productId = orderProduct.item;
        const quantityToIncrement = orderProduct.quantity;
        console.log(productId, quantityToIncrement, "hello got it");
        await Product.findOneAndUpdate(
          { _id: productId }, 
          { status: true, $inc: { stock: quantityToIncrement } }
        );
      }
      res.redirect(`/my-orders/${req.session.user._id}`);
    } catch (error) {
      console.log(error);
    }
  },
  postReturnReason: async (req, res) => {
    const orderId = req.params.id;
    const { reason } = req.body;
    try {
      let returned = await Order.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            reason: reason,
            status: "returned",
          },
        }
      );
      let totalAmount = returned.totalAmount;
      let walletAmount = await userSchema.findByIdAndUpdate(
        req.session.user._id,
        { $inc: { wallet: totalAmount } }
      );
      let orderProducts = await Order.findOne({ _id: orderId });
      for (const orderProduct of orderProducts.items) {
        const productId = orderProduct.item;
        const quantityToIncrement = orderProduct.quantity;
        await Product.findOneAndUpdate(
          { _id: productId },
          { status: true, $inc: { stock: quantityToIncrement } }
        );
      }
      res.redirect(`/my-orders/${req.session.user._id}`);
    } catch (error) {
      console.log(error);
    }
  },

  verifyPayment: async (req, res) => {
    let hmac = crypto.createHmac("sha256", process.env.RazorpaySecret);
    hmac.update(
      req.body.payment.razorpay_order_id +
        "|" +
        req.body.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac === req.body.payment.razorpay_signature) {
      await Order.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.body.order._id) },
        { paymentStatus: "placed" }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  },

  getUserOrders: async (req, res) => {
    try {
      let users = req.params.id;
      const orderCount = await Order.find({ customerId: users }).count();
      const pages = generatePages.generatePageNumbers(orderCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const orderDetails = await Order.find({ customerId: users })
        .skip((page - 1) * 10)
        .limit(10)
        .sort({ orderDate: -1 })
        .lean();
      console.log(orderDetails, "userOrderDetails");
      res.render("admin/viewUserOrders", {
        superAdmin: true,
        subAdmin: true,
        orderDetails,
        pending: true,
        pages,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
        users,
      });
    } catch (error) {
      console.log(error);
    }
  },

  postInvoice: async(req, res) => {
    const orderId = req.params.id
    try {
      let orderDetails = await Order.findOne({_id:orderId})
      let productData = await Order.findOne({_id:orderId}).populate("items.item")
      console.log(productData,"product datas")
      console.log(orderDetails,"order details of invoice")
      invoiceHelper.downloadInvoice(productData)   
      res.json({success:true})  
    } catch (error) {
      console.log(error)
    }
  }
};
