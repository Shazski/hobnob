const Cart = require("../models/cartSchema");
const cartController = require("./cartController");
const mongoose = require("mongoose");
const productSchema = require("../models/productSchema");
const cartHelper = require("../helpers/getCartAmount");
module.exports = {
  getCartTotalAmount: async (req, res) => {
    if (total.length > 0) {
      return total[0].total;
    } else {
      return 0;
    }
  },

  getCartProducts: async (req, res) => {
    const userId = req.session.user._id;
    let total = await cartHelper.getTotalAmount(userId);
    let products = await Cart.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: "$products",
      },

      {
        $project: {
          item: "$products.item",
          quantity: "$products.quantity",
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "product",
        },
      },

      {
        $project: {
          item: 1,
          quantity: 1,
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
    ]);
    res.render("user/cart", { user: req.session.user, products, total });
  },

  addToCart: async (req, res) => {
    const userId = req.session.user._id;
    const proId = req.params.id;
    let proObj = {
      item: proId,
      quantity: 1,
    };
    const userCart = await Cart.findOne({ user: userId });
    console.log(userCart, "userCart");
    if (userCart) {
      const proPresent = await Cart.findOne({
        user: userId,
        "products.item": proId,
      });
      console.log(proPresent, "present");
      if (proPresent) {
        let data = await Cart.updateOne(
          { user: userId, "products.item": proId },
          { $inc: { "products.$.quantity": 1 } }
        );
      } else {
        const pushedData = await Cart.updateOne(
          { user: userId },
          {
            $push: { products: [{ item: proId, quantity: 1 }] },
          }
        );
      }
    } else {
      let userCart = {
        user: userId,
        products: [proObj],
      };
      console.log(userCart, "userCart");
      let cartProduct = await Cart.create({
        products: [{ item: proId, quantity: 1 }],
        user: userId,
      });
    }
  },

  changeQuantity: async (req, res) => {
    let { user, cartId, proId, count, quantity } = req.body;
    count = parseInt(count);
    quantity = parseInt(quantity);
    if (count === -1 && quantity === 1) {
      await Cart.updateOne(
        { user: user, _id: cartId },
        {
          $pull: { products: { item: proId } },
        }
      );
      res.json({ removeProduct: true });
    } else {
      await Cart.updateOne(
        { user: user, _id: cartId, "products.item": proId },
        { 
          $inc: { "products.$.quantity": count },
        }
      );
      let total = await cartHelper.getTotalAmount(user);
      res.json(total);
    }
  },

  changeSize: async (req, res) => {
    let { size, proId } = req.body;
    console.log(proId, "product Id");
    const userId = req.session.user._id;
    try {
      await Cart.findOneAndUpdate(
        { user: userId, "products.item": proId },
        { $set: { "products.$.size": size } }
      );
      let userCart = await Cart.findOne(
        { user: userId, "products.item": proId },
        { _id: 0, products: { $elemMatch: { item: proId } } }
      );
      res.send(userCart.size);
    } catch (error) {
      console.log(error);
    }
  },
};
