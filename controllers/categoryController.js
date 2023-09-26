const Category = require("../models/categorySchema")
const generatePages = require('../service/pageGenerator')
module.exports = {

    getCategory: async(req, res) => {
        try {
            let search = req.query.search || "";
            const userCount = await Category.find({
              category: { $regex: new RegExp(`^${search}`, "i") },
            }).count();
            const pages = generatePages.generatePageNumbers(userCount);
            let page = parseInt(req.query.page) || 1;
            const hasPrev = page > 1;
            const hasNext = page < pages.length;
            const prevPage = hasPrev ? page - 1 : 1;
            const nextPage = hasNext ? page + 1 : pages;
            const categoryDetails = await Category.find({
                category: { $regex: new RegExp(`^${search}`, "i") },
            })
              .skip((page - 1) * 10)
              .limit(10)
              .lean();
              console.log(categoryDetails);
            res.render("admin/categoryManagement", {
              categoryError : req.session.categoryError,
              superAdmin: true,
              subAdmin: true,
              search,
              pages,
              categoryDetails,
              prevPage,
              nextPage,
              hasPrev,
              hasNext,
            });
          } catch (error) {
            console.log(error);
          }
    },

    postCategory: async(req, res) => {
        const {category} = req.body
        try {
            const categoryDetail = await Category.create({category:category,created:new Date().toLocaleDateString()})
            req.session.categoryError = ""
            res.redirect('/admin/category-management')
        } catch (error) {
            if(error.code === 11000) {
                req.session.categoryError = "Category Already exists"
                res.redirect('/admin/category-management')
            }
        }
    },

    deleteCategory: async(req, res) => {
      const catId = req.params.id
      try {
        await Category.findByIdAndDelete(catId)
        res.redirect('/admin/category-management')
      } catch (error) {
        
      }
    },

    editCategory: async(req, res) => {
      const catId = req.params.id
      try {
        let categoryDetails = await Category.findById(catId).lean()
        res.render('admin/editCategory',{categoryDetails})
      } catch (error) {
        console.log(error)
      }
    },

    postEditCategory: async(req, res) => {
      const catId = req.params.id
      const { category } = req.body
      try {
        await Category.findByIdAndUpdate(catId,{category:category})
        res.redirect('/admin/category-management')
      } catch (error) {
        console.log(error)
      }
    }
}