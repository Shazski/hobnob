const Coupon = require("../models/couponSchema");
const generatePages = require("../service/pageGenerator");
const couponHelper = require("../helpers/getCartAmount");
const cartSchema = require("../models/cartSchema");
module.exports = {
  getCoupon: async (req, res) => {
    try {
      let search = req.query.search || "";
      const userCount = await Coupon.find({
        couponName: { $regex: new RegExp(`^${search}`, "i") },
      }).count();
      const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const couponDetails = await Coupon.find({
        couponName: { $regex: new RegExp(`^${search}`, "i") },
      })
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      res.render("admin/couponManagement", {
        categoryError: req.session.categoryError,
        superAdmin: true,
        subAdmin: true,
        search,
        pages,
        couponDetails,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
      });
    } catch (error) {
      console.log(error);
    }
  },

  postCoupon: (req, res) => {
    const { couponName, minAmount, maxAmount, discountAmount, expiryDate } =
      req.body;
    try {
      Coupon.create({
        couponName: couponName,
        minAmount: minAmount,
        maxAmount: maxAmount,
        discountAmount: discountAmount,
        expiryDate: expiryDate,
        created: new Date().toLocaleDateString(),
      });
      res.redirect("/admin/coupon-management");
    } catch (error) {
      if (error.code === 11000) {
        req.session.couponError = "Coupon Already exists";
        res.redirect("/admin/coupon-management");
      }
    }
  },

  deleteCoupon: async (req, res) => {
    const coupId = req.params.id;
    try {
      await Coupon.findByIdAndDelete(coupId);
      res.redirect("/admin/coupon-management");
    } catch (error) {
      console.log(error);
    }
  },

  validateCoupon: async (req, res) => {
    const { couponCode } = req.body;
    try {
      if (couponCode !== "") {
        let couponDetails = await Coupon.findOne({ couponName: couponCode });
        if (couponDetails) {
          req.session.couponDetails = couponDetails._id;
          let total = await couponHelper.getTotalAmount(req.session.user._id);
          let discountAmount = total[0].total - couponDetails.discountAmount;
          if (total[0].total > couponDetails.minAmount) {
            if (couponDetails.expiryDate > new Date()) {
              let userTaken = await Coupon.findOne({
                _id: couponDetails._id,
                userId: req.session.user._id,
              });
              if (!userTaken) {
                await cartSchema.findOneAndUpdate(
                  { user: req.session.user._id },
                  {
                    totalAmount: discountAmount,
                  }
                );
                res.json({
                  success: true,
                  amount: discountAmount,
                  discount: couponDetails.discountAmount,
                });
              } else {
                res.json("You have already used this coupon");
              }
            } else {
              res.json("coupon is expired");
            }
          } else {
            res.json(
              `Min cart amount must be greater or equals to ${couponDetails.minAmount}`
            );
          }
        } else {
          res.json("coupon is not available");
        }
      } else {
        res.json("enter coupon code");
      }
    } catch (error) {
      if (error.code === 11000) {
        res.json("You have already used this coupon");
      }
      console.log(error);
    }
  },

  editCoupon: async (req, res) => {
    const couponId = req.params.id;
    try {
      let couponDetails = await Coupon.findById(couponId).lean();
      res.render("admin/editCoupon", {
        couponDetails,
        superAdmin: true,
        subAdmin: true,
      });
    } catch (error) {
      console.log(error);
    }
  },

  postEditCoupon: async (req, res) => {
    const couponId = req.params.id;
    try {
      await Coupon.findByIdAndUpdate(couponId, { ...req.body });
      res.redirect("/admin/coupon-management");
    } catch (error) {
      console.log(error);
    }
  },
};
