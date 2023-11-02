const productSchema = require("../models/productSchema");
const categorySchema = require("../models/categorySchema");
const cron = require("node-cron");


cron.schedule("*/1 * * * *", async () => {
  let currDate = new Date();
  console.log("Running cron job to update category offer prices...");
  let categoryDetails = await categorySchema.find({
    offerExpiryDate: { $lte: currDate },
    offerAmount: { $gt: 0 },
  });
  for (const category of categoryDetails) {
    let updateData = await productSchema.findOneAndUpdate(
      { category: category._id },
      {
        $inc: {
          offerPrice: category.offerAmount,
        },
      }
    );
    if (updateData) {
      await categorySchema.findOneAndUpdate(
        { _id: updateData.category, offerExpiryDate: { $lte: currDate } },
        {
          offerAmount: 0,
        }
      );
    }
  }
});

cron.schedule("*/1 * * * *", async () => {
  console.log("Running cron job to update offer prices...");
  let productDetails = await productSchema.find();
  let currDate = new Date();
  for (const product of productDetails) {
    await productSchema.updateMany(
      {
        offerExpiryDate: { $lt: currDate },_id:product._id
      },
      { offerPrice: product.basePrice }
    );
  }
});
