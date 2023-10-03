const Order = require('../models/orderSchema')
const Cart = require('../models/cartSchema')
const mongoose = require('mongoose');
module.exports = {
    getProductsDetails : async(orderId) => {
    let products =  await Order.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(orderId),
              },
            },
            {
              $unwind: "$items",
            },
            {
              $project: {
                item: "$items.item",
                quantity: "$items.quantity",
                size:"$items.size"
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
                size: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])
          return products
    },
    getCartProductsDetails : async(userId,proId) => {
    let products =  await Cart.aggregate([
            {
              $match: {
                user: new mongoose.Types.ObjectId(userId),
              },
            },
            {
              $unwind: "$products",
            },
            {
              $match:{
                'products.item':new mongoose.Types.ObjectId(proId)
              }
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
                size:"$products.size"
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
                size: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])
          return products
    }
}