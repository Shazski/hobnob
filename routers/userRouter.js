const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth = require("../middleware/userAuth");
const productContoller = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const paymentController = require('../controllers/paymentContoller')
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
  .all(userAuth.userAuth,userAuth.checkStatus )
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

router.route('/payment').all(userAuth.userAuth, userAuth.checkStatus).post(paymentController.postPayment) 

module.exports = router;
