const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth = require("../middleware/userAuth");
const productContoller = require("../controllers/productController");
const cartController = require("../controllers/cartController");
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

router.route("/").all(userAuth.userAuth).get(userController.getHomePage);

router
  .route("/view-product/:id")
  .all(userAuth.userAuth)
  .get(productContoller.getViewProduct);

router.route("/logout").get(userController.getUserLogout);

router
  .route("/cart")
  .all(userAuth.userAuth)
  .get(cartController.getCartProducts);

router.route('/add-to-cart/:id').all(userAuth.userAuth).post(cartController.addToCart)  

router.route("/change-product-quantity").all(userAuth.userAuth).post(cartController.changeQuantity)

module.exports = router;
