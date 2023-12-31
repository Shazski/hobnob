const Cart = require("../models/cartSchema");
const cartController = require("./cartController");
const mongoose = require("mongoose");
const productSchema = require("../models/productSchema");
const cartHelper = require("../helpers/getCartAmount");
const cartProductHelper = require("../helpers/getProducts");
const WishList = require('../models/wishlistSchema')
module.exports = {
  getCartProducts: async (req, res) => {
    const userId = req.session.user._id;
    if (userId) {
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
            size: "$products.size",
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
            size: 1,
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
    const { size } = req.body;
    if (userId) {
      let proObj = {
        item: proId,
        quantity: 1,
        size: size,
      };
      const userCart = await Cart.findOne({ user: userId });
      if (userCart) {
        const proPresent = await Cart.findOne({
          user: userId,
          "products.item": proId,
          "products.size": size,
        });
        if (proPresent) {
          let data = await Cart.updateOne(
            {
              user: userId,
              $and: [{ "products.item": proId }, { "products.size": size }],
            },
            { $inc: { "products.$.quantity": 1 } }
          );
        } else {
          const pushedData = await Cart.updateOne(
            { user: userId },
            {
              $push: { products: [{ item: proId, quantity: 1, size: size }] },
            }
          );
        }
      } else {
        let userCart = {
          user: userId,
          products: [proObj],
        };
        let cartProduct = await Cart.create({
          products: [{ item: proId, quantity: 1, size: size }],
          user: userId,
        });
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },
  addToWishList: async (req, res) => {
    const userId = req.session.user._id;
    const proId = req.params.id;
    if (userId) {
      const userWishlist = await WishList.findOne({ user: userId });
      if (userWishlist) {
          const pushedData = await WishList.updateOne(
            { user: userId },
            {
              $addToSet: { products: [proId] },
            }
          );
      } else {
        let cartProduct = await WishList.create({
          products: proId,
          user: userId,
        });
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getWishProducts: async(req, res) => {
   let wishProduct = await WishList.findOne({user:req.session.user._id}).populate("products").lean()
   if(wishProduct.products.length > 0) {
     res.render('user/wishlist',{wishProduct,user:req.session.user})
   } else {
    res.render('user/wishlist',{wishProduct,user:req.session.user,noProduct:true})
   }
  },

  changeQuantity: async (req, res) => {
    let { user, cartId, proId, count, quantity, size } = req.body;
    count = parseInt(count);
    quantity = parseInt(quantity);
    if (count === -1 && quantity === 1) {
      await Cart.updateOne(
        { _id: cartId,user: user,
          $and: [{ user: user }, { _id: cartId }],
          products: {
            $elemMatch: { size: size, item: proId },
          },
        }  ,
        {
          $pull: { products: { item: proId, size: size } },
        }
      );
      res.json({ removeProduct: true });
    } else {
      let product = await cartProductHelper.getCartProductsDetails(user, proId);
      if (product[0].product.stock <= quantity && count === 1) {
        res.json({ status: false });
      } else if (product[0].product.stock <= quantity && count === -1) {
        await Cart.updateOne(
          {
            $and: [{ user: user }, { _id: cartId }],
            products: {
              $elemMatch: { size: size, item: proId },
            },
          },
          {
            $inc: { "products.$.quantity": count },
          }
        );
        let total = await cartHelper.getTotalAmount(user);
        res.json(total);
      } else {
        let cartschema = await Cart.findOne();
        await Cart.findOneAndUpdate(
          {
            $and: [{ user: user }, { _id: cartId }],
            products: {
              $elemMatch: { size: size, item: proId },
            },
          },
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
    const proId = req.query.proId;
    const size = req.query.size;
    if (req.session.user) {
      const userId = req.session.user._id;
      try {
        await Cart.updateOne(
          { $and: [{ user: userId }, { "products.size": size }] },
          {
            $pull: { products: { item: proId, size: size } },
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
  removeWishProduct: async (req, res) => {
    const proId = req.query.proId;
    if (req.session.user) {
      const userId = req.session.user._id;
      try {
        await WishList.updateOne(
          {  user: userId  },
          {
            $pull: { products: proId },
          }
        );
        res.redirect("/wishlist");
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  updateTotalAmount: async(req, res) => {
    const { amount } = req.body
    try {
      await Cart.findOneAndUpdate({user:req.session.user._id},{
        totalAmount:parseInt(amount)
      })
      let products = await Cart.findOne({user:req.session.user._id}).populate("products.item")
      for (const product of products.products) {
        if(product.quantity > product.item.stock) {
          res.json({success:false})
        } else {
          res.json({success:true})
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
};
