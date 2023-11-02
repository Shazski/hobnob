const Admin = require("../models/adminSchema");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userSchema");
const generatePages = require("../service/pageGenerator");
const Order = require("../models/orderSchema");
const productSchema = require("../models/productSchema");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
module.exports = {
  getAdminLogin: (req, res) => {
    res.render("admin/adminLogin", { adminError: req.session.adminError });
  },

  postAdminLogin: async(req, res) => {
    const { userName, password } = req.body;
    console.log(req.body, "body");
    let adminExists = await Admin.findOne({ userName: userName });

    if (adminExists) {
      let passwordTrue = bcrypt.compareSync(password, adminExists.password);
      if (passwordTrue) {
        req.session.adminError = "";
        let updateAdminLogin = await Admin.findOneAndUpdate(
          { userName: userName },
          { lastLogin: new Date() }
        );
        console.log(updateAdminLogin, "update time");
        if (updateAdminLogin) {
          if (updateAdminLogin.role === "superAdmin") {
            let superAdminToken = sign(
              { id: updateAdminLogin._id, userName: updateAdminLogin.userName },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.cookie("adminJwt", superAdminToken, { maxAge: 3600000 });
            req.session.superAdmin = true;
            res.redirect("/admin/admin-panel");
          } else if (updateAdminLogin.role === "subAdmin") {
            let subAdminToken = sign(
              { id: updateAdminLogin._id, userName: updateAdminLogin.userName },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.cookie("adminJwt", subAdminToken, { maxAge: 3600000 });
            req.session.subAdmin = true;
            res.redirect("/admin/admin-panel");
          }
        }
      } else {
        req.session.adminError = "admin is not valid";
        res.redirect("/admin/login");
      }
    } else {
      req.session.adminError = "admin is not valid";
      res.redirect("/admin/login");
    }
  },

  getAdminPanel: async(req, res) => {
    let mostSellingProduct = await Order.aggregate([
      // Unwind the 'items' array to deconstruct it into separate documents
      { $unwind: '$items' },
    
      // Group by the 'item' and sum the 'quantity' for each product
      {
        $group: {
          _id: '$items.item',
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
    
      // Sort in descending order to find the most sold product
      { $sort: { totalQuantity: -1 } },
    
      // Limit to the first result to get the most sold product
      { $limit: 5 },
    ])
    const productIds = mostSellingProduct.map((item) => item._id);
    const quantity = mostSellingProduct.map((item) => item.totalQuantity)
    console.log(quantity,'my quantity')
    let productDetails = await productSchema.find({ _id: { $in: productIds } }).lean()
    productDetails.forEach((product, index) => {
      product.quantity = quantity[index];
    });
    res.render("admin/adminDashboard", {
      superAdmin: true,
      subAdmin: true,
      productDetails,
      quantity
    });
  },

  getAdminPanelGraph: async(req, res) => {
    const filter = req.params.filter;
    if(filter) {
      const currentDate = new Date();
      
  let startDate, endDate;

  if (filter === 'day') {
    startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 7);
    endDate = currentDate;
  } else if (filter === 'month') {
    startDate = new Date(currentDate);
    startDate.setMonth(currentDate.getMonth() - 12);
    endDate = currentDate;
  } else if (filter === 'year') {
    startDate = new Date(currentDate);
    startDate.setFullYear(currentDate.getFullYear() - 5);
    endDate = currentDate;
  } else {
    res.status(400).json({ message: 'Invalid filter.' });
    return;
  }
  try {
    // Query the MongoDB collection to retrieve orders within the specified date range
    const orders = await Order.aggregate([{
      $match:{orderDate: { $gte: startDate, $lte: endDate },status:{
        $nin:["canceled","returned"]
      }},
    },{
      $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } }, total: { $sum: '$totalAmount' } }
    },{
      $project:{
        total:'$total'
      }
    }]);
    res.json(orders)
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders.' });
  }
} 
  
},

  getUserDetails: async (req, res) => {
    try {
      let search = req.query.search || "";
      let sortData = req.query.sort || "created";
      const userCount = await User.find({
        name: { $regex: new RegExp(`^${search}`, "i") },
      }).count();
      const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page >= 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const userDetails = await User.find({
        name: { $regex: new RegExp(`^${search}`, "i") },
      })
        .sort(sortData)
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      res.render("admin/userManagement", {
        superAdmin: true,
        subAdmin: true,
        search,
        pages,
        userDetails,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getBlockUser: async (req, res) => {
    try {
      let userId = req.params.id;
      let user = await User.findById(userId);
      let blockData = !user.blockStatus;
      let data = await User.findByIdAndUpdate(userId, {
        blockStatus: blockData,
      });
      console.log(data, "blocked data");
      res.redirect("/admin/user-management");
    } catch (error) {
      console.log(error);
    }
  },

  adminLogout: (req, res) => {
    res.clearCookie("adminJwt");
    res.redirect("/admin/login");
  },

  getAllRefferals: async (req, res) => {
    let search = req.query.search || "";
   let userCount = await User.find({
    name: { $regex: new RegExp(`^${search}`, "i") },
      refferalCode: { $exists: true },
    }).count()
    const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page >= 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
    try {
     let refferalUser = await User.find({
      name: { $regex: new RegExp(`^${search}`, "i") },
        refferalCode: { $exists: true },
      })
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      res.render("admin/viewRefferals", {
        superAdmin: true,
        subAdmin: true,
        pages,
        refferalUser,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
      });
    } catch (error) {
      console.log(error);
    }
  },

  downloadCsv : async(req, res) => {
    
    let startDate = req.query.startDate 
    let endDate = req.query.endDate 
    let orders =await Order.find({orderDate:{
      $gt:startDate,$lt:endDate
    }}).lean()
      if (orders.length === 0) {
        res.status(404).send('No orders found.');
        return;
      }
  
      const csvWriter = createCsvWriter({
        path: '/hobnob ecommerce/public/csv/orders.csv',
        header : [
          { id: 'paymentMode', title: 'Payment Mode' },
          { id: 'orderDate', title: 'Order Date' },
          { id: 'customerId', title: 'Customer ID' },
          { id: 'status', title: 'Status' },
          { id: 'totalAmount', title: 'Total Amount' },
          { id: 'couponId', title: 'Coupon ID' },
          { id: 'paymentStatus', title: 'Payment Status' },
        ],
      });
  
      csvWriter.writeRecords(orders)
        .then(() => {
          // Send the CSV file as a response for download
          res.download('/hobnob ecommerce/public/csv/orders.csv', 'orders.csv', (err) => {
            if (err) {
              console.error('Error sending CSV file: ' + err);
              res.status(500).send('Internal Server Error');
            }
          });
        }); 
      }
};
