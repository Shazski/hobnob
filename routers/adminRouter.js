const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const adminAuth = require("../middleware/adminAuth");
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");

router.route("/login").all(adminAuth.adminValid).get(adminController.getAdminLogin).post(adminController.postAdminLogin);

router.route('/admin-panel').all(adminAuth.adminAuth).get(adminController.getAdminPanel)

router.route('/user-management').all(adminAuth.adminAuth).get(adminController.getUserDetails)

router.route('/block-user/:id').all(adminAuth.adminAuth).get(adminController.getBlockUser)

router.route('/category-management').all(adminAuth.adminAuth).get(categoryController.getCategory).post(categoryController.postCategory)

router.route('/add-product').get(productController.getAddProduct).post(upload.array("images",4),productController.postAddProduct)

router.route('/view-products').get(productController.getAllProducts)

router.route('/edit-product/:id').get(productController.editProduct).post(upload.array("images",4),productController.updateProduct) 

router.route('/delete-product/:id').get(productController.deleteProduct)

module.exports = router