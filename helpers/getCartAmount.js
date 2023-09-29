const Cart = require('../models/cartSchema')
const mongoose = require('mongoose');
module.exports = {
    getTotalAmount : async(user) => {
        return await Cart.aggregate([
            {
              $match: {
                user: new mongoose.Types.ObjectId(user),
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
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: [
                      { $toInt: "$product.offerPrice" },
                      { $toInt: "$quantity" },
                    ],
                  },
                },
              },
            },
          ]);
    }
}