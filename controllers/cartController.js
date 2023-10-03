const Cart = require("../models/cartSchema");
const cartController = require("./cartController");
const mongoose = require("mongoose");
const productSchema = require("../models/productSchema");
const cartHelper = require("../helpers/getCartAmount");
const cartProductHelper = require("../helpers/getProducts");
module.exports = {
  getCartProducts: async (req, res) => {
    const userId = req.session.user._id;
    if (userId) {
      let total = await cartHelper.getTotalAmount(userId);
      console.log(total, "total");
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
      if (total.length !== 0) {
        res.render("user/cart", {
          user: req.session.user,
          products,
          total,
          totalStatus: true,
        });
      } else {
        res.render("user/cart", {
          user: req.session.user,
          cartEmpty: "cart is empty",
          totalStatus: false,
        });
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  addToCart: async (req, res) => {
    const userId = req.session.user._id;
    const proId = req.params.id;
    if (userId) {
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
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
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
      let product = await cartProductHelper.getCartProductsDetails(user,proId)
      if(product[0].product.stock === quantity && count === 1) {
        res.json({status:false})
      }else if (product[0].product.stock === quantity && count === -1) {
        await Cart.updateOne(
          { user: user, _id: cartId, "products.item": proId },
          {
            $inc: { "products.$.quantity": count },
          }
          );
          let total = await cartHelper.getTotalAmount(user);
      res.json(total);
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
  }
  },

  changeSize: async (req, res) => {
    let { size, proId } = req.body;
    console.log(proId, "product Id");
    const userId = req.session.user._id;
    if (userId) {
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
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  removeProduct: async (req, res) => {
    const proId = req.params.id;
    if (req.session.user) {
      const userId = req.session.user._id;
      try {
        await Cart.updateOne(
          { user: userId },
          {
            $pull: { products: { item: proId } },
          }
        );
        res.redirect("/cart");
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },
};
