const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const orderController = require("../controllers/orderContoller");
const adminAuth = require("../middleware/adminAuth");
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");
const couponController = require("../controllers/couponController");
const bannerController = require("../controllers/bannerController");
router
  .route("/login")
  .all(adminAuth.adminValid)
  .get(adminController.getAdminLogin)
  .post(adminController.postAdminLogin);

router
  .route("/admin-panel")
  .all(adminAuth.adminAuth)
  .get(adminController.getAdminPanel);

router
  .route("/user-management")
  .all(adminAuth.adminAuth)
  .get(adminController.getUserDetails);

router
  .route("/block-user/:id")
  .all(adminAuth.adminAuth)
  .get(adminController.getBlockUser);

router
  .route("/category-management")
  .all(adminAuth.adminAuth)
  .get(categoryController.getCategory)
  .post(categoryController.postCategory);

router
  .route("/add-product")
  .all(adminAuth.adminAuth)
  .get(productController.getAddProduct)
  .post(upload.array("images", 4), productController.postAddProduct);

router
  .route("/view-products")
  .all(adminAuth.adminAuth)
  .get(productController.getAllProducts);

router
  .route("/edit-product/:id")
  .all(adminAuth.adminAuth)
  .get(productController.editProduct)
  .post(upload.array("images", 4), productController.updateProduct);

router
  .route("/delete-product/:id")
  .all(adminAuth.adminAuth)
  .get(productController.deleteProduct);

router
  .route("/delete-category/:id")
  .all(adminAuth.adminAuth)
  .get(categoryController.deleteCategory);

router
  .route("/edit-category/:id")
  .all(adminAuth.adminAuth)
  .get(categoryController.editCategory)
  .post(categoryController.postEditCategory);
router
  .route("/edit-coupon/:id")
  .all(adminAuth.adminAuth)
  .get(couponController.editCoupon)
  .post(couponController.postEditCoupon);

router
  .route("/logout")
  .all(adminAuth.adminAuth)
  .get(adminController.adminLogout);

router
  .route("/order-management")
  .all(adminAuth.adminAuth)
  .get(orderController.getAllOrders);

router
  .route("/orderDetails/:id")
  .all(adminAuth.adminAuth)
  .get(orderController.getOrderDetails);

router
  .route("/change-order-status/:id")
  .all(adminAuth.adminAuth)
  .post(orderController.changeOrderStatus);

router
  .route("/coupon-management")
  .all(adminAuth.adminAuth)
  .get(couponController.getCoupon)
  .post(couponController.postCoupon);

router
  .route("/delete-coupon/:id")
  .all(adminAuth.adminAuth)
  .get(couponController.deleteCoupon);

router
  .route("/view-user-orders/:id")
  .all(adminAuth.adminAuth)
  .get(orderController.getUserOrders);

router
  .route("/banner")
  .all(adminAuth.adminAuth)
  .get(bannerController.getBanner)
  .post(upload.single("image"), bannerController.postBannner);

  router
  .route("/delete-banner/:id")
  .all(adminAuth.adminAuth)
  .get(bannerController.deleteBanner);

module.exports = router;
