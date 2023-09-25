const sharp = require("sharp");
const Category = require("../models/categorySchema");
const productSchema = require("../models/productSchema");
const path = require("path");
const fs = require("fs");
const generatePages = require("../service/pageGenerator");
module.exports = {
  getViewProduct: async (req, res) => {
    const id = req.params.id;
    console.log(id);
    let productDetails = await productSchema.findById(id).lean();
    res.render("user/viewProduct", { productDetails: productDetails });
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
    } = req.body;
    console.log(req.body);
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
        fs.unlinkSync(file.destination + file.filename);
      }
      const images = req.files.map((value, index, array) => value.filename);
      let productDetails = await productSchema.create({
        name: name,
        color: color,
        basePrice: parseInt(basePrice),
        offerPrice: parseInt(offerPrice),
        stock: parseInt(stock),
        brand: brand,
        gender: gender,
        size: size,
        description: description,
        status: status,
        created: new Date().toLocaleDateString(),
        images: images,
        category: category,
      });
      if (productDetails) {
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
        console.log(productDetails,"details");
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
      res.render("admin/editProducts", { productDetails });
    } catch (error) {
      console.log(error);
    }
  },

  updateProduct: async (req, res) => {
    let product = req.body;
    let proId = req.params.id;
    console.log(product, "product");
    try {
      console.log(req.files);
      if (req.files.length > 0) {
        console.log("hello varindoooo");
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

      console.log(updateProduct, "updated");
      res.redirect("/admin/view-products");
    } catch (error) {
      console.log(error)
    }
  },

  deleteProduct: async(req, res) => {
    const proId = req.params.id
    try { 
     let product = await productSchema.findById(proId)
     proStatus = !product.status
     await productSchema.findByIdAndUpdate(proId,{status:proStatus})
     res.redirect('/admin/view-products')
    } catch (error) {
      console.log(error);
    }
  }
};
