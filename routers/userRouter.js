const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth = require("../middleware/userAuth");
const productContoller = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderContoller");
const couponController = require("../controllers/couponController");
router
  .route("/login")
  .all(userAuth.userValid)
  .get(userController.getUserLogin)
  .post(userController.postUserLOgin);

router
  .route("/sign-up")
  .all(userAuth.userValid)
  .get(userController.getUserSignUp)
  .post(userController.PostUserSignUp);
router
  .route("/sign-up/:id")
  .all(userAuth.userValid)
  .get(userController.getRefferalUserSignUp)
  .post(userController.PostRefferalUserSignUp);

router.route("/get-otp").post(userController.generateOtp);

router
  .route("/forgot-password")
  .get(userController.getForgotPassword)
  .post(userController.postForgetPassword);

router
  .route("/change-password")
  .get(userController.getChangePassword)
  .post(userController.postChangePassword);

router
  .route("/")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.getHomePage);

router
  .route("/view-product/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(productContoller.getViewProduct);

router.route("/logout").get(userController.getUserLogout);

router
  .route("/cart")
  .get(userAuth.userAuth, userAuth.checkStatus, cartController.getCartProducts);

router
  .route("/add-to-cart/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(cartController.addToCart);
router
  .route("/add-to-wishlist/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(cartController.addToWishList);

router
  .route("/change-product-quantity")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(cartController.changeQuantity);

router
  .route("/change-size")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(cartController.changeSize);

router
  .route("/profile")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.getProfile)
  .post(userController.postProfile);

router
  .route("/profile/address")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.getAddress)
  .post(userController.postAddress);

router
  .route("/checkout")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.getCheckout);

router
  .route("/view-all-address")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.getAllAddress);

router
  .route("/remove-address/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.removeAddress);

router
  .route("/payment")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(orderController.postOrder);

router
  .route("/success")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(orderController.getSuccess);

router
  .route("/profile/change-password")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.changePassword);

router
  .route("/remove-product/")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(cartController.removeProduct);
router
  .route("/remove-wishlist-product/")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(cartController.removeWishProduct);

router
  .route("/edit-address/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(userController.editAddress)
  .post(userController.postEditAddress);

router
  .route("/my-orders/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(orderController.getMyOrders);

router
  .route("/my-order-details/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(orderController.getMyOrderDetails);

router
  .route("/cancel-reason/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(orderController.postCancelReason);
router
  .route("/return-reason/:id")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(orderController.postReturnReason);

router
  .route("/verify-payment")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(orderController.verifyPayment);

router
  .route("/validate-coupon")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(couponController.validateCoupon);

router
  .route("/update-amount")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .post(cartController.updateTotalAmount);

router
  .route("/shop")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(productContoller.getAllShopProducts);

router
  .route("/wishlist")
  .all(userAuth.userAuth, userAuth.checkStatus)
  .get(cartController.getWishProducts);

router.route("/download-invoice/:id").post(orderController.postInvoice);

module.exports = router;
