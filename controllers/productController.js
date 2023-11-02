const sharp = require("sharp");
const mongoose = require("mongoose");
const Category = require("../models/categorySchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const productSchema = require("../models/productSchema");
const path = require("path");
const fs = require("fs");
const generatePages = require("../service/pageGenerator");
const { isValidObjectId } = require("mongoose");
const categorySchema = require("../models/categorySchema");
const { format } = require("path");
const { query } = require("express");
module.exports = {
  getViewProduct: async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!isValidObjectId(id)) {
        res.render("error", { user: req.session.user });
      } else {
        let cartCount = await Cart.findOne({user: req.session.user._id}).lean()
        const productDetails = await productSchema.findById(id).lean();
        if (!productDetails) {
          res.render("error", { user: req.session.user });
        } else {
          res.render("user/viewProduct", {
            productDetails: productDetails,
            cartCount : cartCount?.products.length,
            user: req.session.user,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  },

  getAddProduct: async (req, res) => {
    let categoryDetails = await Category.find().lean();
    res.render("admin/addProduct", { superAdmin: true, categoryDetails });
  },

  postAddProduct: async (req, res) => {
    const {
      name,
      color,
      basePrice,
      offerPrice,
      stock,
      brand,
      gender,
      size,
      description,
      status,
      category,
      offerExpiryDate,
    } = req.body;
    try {
      for (const file of req.files) {
        const outputPath = path.resolve(
          file.destination,
          "cropped",
          file.filename
        );
        await sharp(file.destination + file.filename)
          .resize(parseInt(600), parseInt(600))
          .toFile(outputPath);
      }
      const images = req.files.map((value, index, array) => value.filename);
      let expiryDate = new Date(offerExpiryDate);
      let productDetails = await productSchema.create({
        name: name,
        color: color,
        basePrice: Math.abs(parseInt(basePrice)),       
        offerPrice: Math.abs(parseInt(offerPrice)),
        stock: parseInt(stock),
        brand: brand,
        gender: gender,
        size: size,
        description: description,
        status: status,
        created: new Date().toLocaleDateString(),
        images: images,
        category: category,
        offerExpiryDate: expiryDate,
      });
      if (productDetails) {
       let categorys =  await categorySchema.find({_id:category,offerExpiryDate:{$gt:new Date()}
       })
       console.log(categorys[0],"catgeorudasdsad")
        await productSchema.updateMany({category:categorys[0]._id,offerPrice :{$gt:categorys[0].offerAmount}},{
          $inc :{
            offerPrice:-categorys[0].offerAmount
          }
        })
        res.redirect("/admin/add-product");
      } else {
        res.json(productDetails).status(404);
      }
    } catch (error) {
      console.log(error);
    }
  },

  getAllProducts: async (req, res) => {
    try {
      let search = req.query.search || "";
      const userCount = await productSchema
        .find({
          name: { $regex: new RegExp(`^${search}`, "i") },
        })
        .count();
      const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const productDetails = await productSchema
        .find({
          name: { $regex: new RegExp(`^${search}`, "i") },
        })
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      res.render("admin/viewProducts", {
        productDetails,
        superAdmin: true,
        subAdmin: true,
        search,
        pages,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
      });
    } catch (error) {
      console.log(error);
    }
  },

  editProduct: async (req, res) => {
    const proId = req.params.id;
    try {
      let productDetails = await productSchema.findById(proId).lean();
      const currentDate = productDetails.offerExpiryDate;
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      res.render("admin/editProducts", { productDetails, formattedDate });
    } catch (error) {
      console.log(error);
    }
  },

  updateProduct: async (req, res) => {
    let product = req.body;
    let proId = req.params.id;
    try {
      if (req.files.length > 0) {
        for (const file of req.files) {
          const outputPath = path.resolve(
            file.destination,
            "cropped",
            file.filename
          );
          await sharp(file.destination + file.filename)
            .resize(parseInt(600), parseInt(600))
            .toFile(outputPath);
          fs.unlinkSync(file.destination + file.filename);
        }
        product.images = req.files.map((value, index, array) => value.filename);
      }
      product.updated = new Date().toLocaleDateString();
      let updateProduct = await productSchema.findByIdAndUpdate(proId, {
        ...product,
      });
      let productStatus = await productSchema.findById(proId);
      if (productStatus.status === false && productStatus.stock > 0) {
        await productSchema.findByIdAndUpdate(proId, {
          status: true,
        });
      } else if(productStatus.status === true && productStatus.stock === 0){
        await productSchema.findByIdAndUpdate(proId, {
          status: false,
        });
      }
      res.redirect("/admin/view-products");
    } catch (error) {
      console.log(error);
    }
  },

  deleteProduct: async (req, res) => {
    const proId = req.params.id;
    try {
      let product = await productSchema.findById(proId);
      proStatus = !product.status;
      await productSchema.findByIdAndUpdate(proId, { status: proStatus });
      res.redirect("/admin/view-products");
    } catch (error) {
      console.log(error);
    }
  },

  getAllShopProducts: async (req, res) => {
    try {
      let brands = await productSchema
        .find({}, { _id: false, brand: true })
        .distinct("brand");
      let category = await categorySchema.find({}, { category: 1 }).lean();
      let search = req.query.search || "";
      let brand = req.query.brand || brands;
      let categorySearch = req.query.category || "";
      let minAmount = parseInt(req.query.minAmount) || 10;
      let maxAmount = parseInt(req.query.maxAmount) || 100000;
      let cartCount = await Cart.find({user: req.session.user._id}).count().lean()
      const userCount = await productSchema
        .find({
          $or: [
            { name: { $regex: search, $options: 'i' } }, 
            { brand: { $regex: search, $options: 'i' } }, 
        ]
        })
        .count();
      const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page > 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      if (categorySearch !== "") {
        const productDetails = await productSchema
          .find({
            $or: [
              { name: { $regex: search, $options: 'i' } }, 
              { brand: { $regex: search, $options: 'i' } }, 
          ],
            brand: { $in: brand },
            category: { $in: categorySearch },
            offerPrice: { $gt: minAmount, $lt: maxAmount },
          })
          .skip((page - 1) * 10)
          .limit(10)
          .lean();
        if (productDetails.length > 0) {
          res.render("user/viewShopProducts", {
            brands,
            productError: req.session.categoryError,
            user: req.session.user,
            search,
            pages,
            category,
            productDetails,
            prevPage,
            nextPage,
            hasPrev,
            hasNext,
            cartCount
          });
        } else {
          res.render("user/viewShopProducts", {
            brands,
            productError: req.session.categoryError,
            noProduct: true,
            user: req.session.user,
            search,
            pages,
            category,
            productDetails,
            prevPage,
            nextPage,
            hasPrev,
            hasNext,
            cartCount
          });
        }
      } else {
        const productDetails = await productSchema
          .find({
            $or: [
              { name: { $regex: search, $options: 'i' } }, 
              { brand: { $regex: search, $options: 'i' } }, 
          ],
            brand: { $in: brand },
            offerPrice: { $gte: minAmount, $lte: maxAmount },
          })
          .skip((page - 1) * 10)
          .limit(10)
          .lean();
        if (productDetails.length > 0) {
          console.log("products found");
          res.render("user/viewShopProducts", {
            brands,
            productError: req.session.categoryError,
            user: req.session.user,
            search,
            pages,
            category,
            productDetails,
            prevPage,
            nextPage,
            hasPrev,
            hasNext,
            cartCount
          });
        } else {
          console.log("no product");
          res.render("user/viewShopProducts", {
            brands,
            productError: req.session.categoryError,
            noProduct: true,
            user: req.session.user,
            search,
            pages,
            category,
            productDetails,
            prevPage,
            nextPage,
            hasPrev,
            hasNext,
            cartCount
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  },

};
