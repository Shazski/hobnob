const otpGenerator = require("../service/otpGenerator");
const mail = require("../service/nodeMailer");
const Otp = require("../models/otpSchema");
const User = require("../models/userSchema");
const Order = require("../models/orderSchema");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
const hashpassword = require("../service/hashPassword");
const productSchema = require("../models/productSchema");
const { isValidObjectId } = require("mongoose");
const cartHelper = require("../helpers/getCartAmount");
const mongoose = require("mongoose");
const cartSchema = require("../models/cartSchema");
const Banner = require("../models/bannerSchema");
module.exports = {
  getUserLogin: (req, res) => {
    res.render("user/userLogin", { errorLogin: req.session.errorLogin });
  },

  getUserSignUp: (req, res) => {
    res.render("user/userSignUp", { error: req.session.error });
  },
  getRefferalUserSignUp: (req, res) => {
    const refferalId = req.params.id;
    res.render("user/userRefferalSignUp", {
      error: req.session.error,
      refferalId,
    });
  },

  generateOtp: async (req, res) => {
    const { email } = req.body;
    const otpNumber = otpGenerator.generateOtp();
    try {
      if (email) {
        let otpId = await Otp.create({ Otp: otpNumber, Email: email });

        if (otpId) {
          setTimeout(async () => {
            await Otp.findByIdAndUpdate(otpId, { Otp: "" });
            console.log("Otp removed try side");
          }, 60000);
          mail.sendEmail(email, `Your Otp is ${otpNumber}`);
        }
        res.send(" ");
      } else if (email == "") {
        res.send("Please enter an correct Email");
      }
    } catch (error) {
      if (error.code === 11000) {
        let resp = await Otp.findOneAndUpdate(
          { Email: error.keyValue.Email },
          { Otp: otpNumber }
        );

        if (resp) {
          setTimeout(async () => {
            await Otp.findByIdAndUpdate(resp._id, { Otp: "" });
            console.log("Otp removed catch side");
          }, 60000);
          mail.sendEmail(email, `Your Otp is ${otpNumber}`);
        }
        res.send("Otp Sent succesfully");
      }
    }
  },

  PostUserSignUp: async (req, res) => {
    const { name, blockStatus, email, otp, phone, password } = req.body;

    try {
      const verifyOtp = await Otp.findOne({
        $and: [{ Email: email }, { Otp: otp }],
      });

      if (verifyOtp) {
        const userId = await User.create({
          name: name,
          blockStatus: blockStatus,
          email: email,
          phone: phone,
          password: password,
          created: new Date().toLocaleDateString(),
        });

        if (userId) {
          let token = sign(
            { userId: userId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.cookie("userJwt", token, { maxAge: 3600000 });
          req.session.user = userId;
          res.redirect("/");
        } else {
          console.log("user signUp failed");
          res.status(500);
        }
      } else {
        req.session.error = "Otp Is Not Valid";
        res.redirect("/sign-up");
      }
    } catch (error) {
      if (error.code === 11000) {
        req.session.error = "Email Is Already Taken";
        res.redirect("/sign-up");
      }
    }
  },
  PostRefferalUserSignUp: async (req, res) => {
    const { name, blockStatus, email, otp, phone, password, refferalCode } =
      req.body;
    console.log(refferalCode, "coodedede");
    try {
      const verifyOtp = await Otp.findOne({
        $and: [{ Email: email }, { Otp: otp }],
      });

      if (verifyOtp) {
        if (refferalCode) {
          const userId = await User.create({
            name: name,
            blockStatus: blockStatus,
            email: email,
            phone: phone,
            password: password,
            created: new Date().toLocaleDateString(),
            refferalCode: refferalCode,
          });

          if (userId) {
            let token = sign(
              { userId: userId, email: email },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            let userData = await User.findOneAndUpdate(
              { _id: refferalCode },
              {
                $inc: {
                  wallet: 20,
                },
              }
            );
            console.log(userData, "useeeeerrrr");
            res.cookie("userJwt", token, { maxAge: 3600000 });
            req.session.user = userId;
            res.redirect("/");
          }
        } else {
          console.log("user signUp failed");
          res.status(500);
        }
      } else {
        req.session.error = "Otp Is Not Valid";
        res.redirect("/sign-up");
      }
    } catch (error) {
      if (error.code === 11000) {
        req.session.error = "Email Is Already Taken";
        res.redirect("/sign-up");
      }
    }
  },

  getForgotPassword: (req, res) => {
    res.render("user/forgotPassword", { error: req.session.error });
  },

  postForgetPassword: async (req, res) => {
    const { email, otp } = req.body;

    try {
      const verifyOtp = await Otp.findOne({
        $and: [{ Email: email }, { Otp: otp }],
      });

      if (verifyOtp) {
        req.session.forgotOtp = true;
        req.session.userEmail = email;
        res.redirect("/change-password");
      } else {
        req.session.error = "Otp is not Valid";
        res.redirect("/forgot-password");
      }
    } catch (error) {
      console.log(error);
    }
  },

  getChangePassword: (req, res) => {
    try {
      if (req.session.forgotOtp || req.session.user) {
        res.render("user/changePassword", {
          userEmail: req.session.userEmail,
          matchError: req.session.matchError,
        });
      } else {
        req.session.error = "enter email and otp for change password";
        res.redirect("/forgot-password");
      }
    } catch (error) {
      console.log(error);
    }
  },

  postChangePassword: async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    try {
      if (newPassword !== confirmPassword) {
        req.session.matchError = "password is not matching";
        if (req.session.user) {
          res.redirect("/profile/change-password");
        } else {
          res.redirect("/change-password");
        }
      } else {
        const hashedPassword = hashpassword.hashPassword(newPassword);
        await User.findOneAndUpdate(
          { email: email },
          { password: hashedPassword }
        );
        req.session.matchError = "";
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
    }
  },

  postUserLOgin: async (req, res) => {
    try {
      const { email, password } = req.body;
      let existingUser = await User.findOne({ email: email });
      if (existingUser) {
        let userPassword = hashpassword.matchPassword(
          password,
          existingUser.password
        );

        if (userPassword) {
          if (existingUser.blockStatus === false) {
            let token = sign(
              { id: existingUser._id, email: email },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.cookie("userJwt", token, { maxAge: 3600000 });
            req.session.user = existingUser;
            req.session.errorLogin = "";
            res.redirect("/");
          } else {
            req.session.errorLogin = "You have been blocked By Admin";
            res.redirect("/login");
          }
        } else {
          console.log("not valid");
          req.session.errorLogin = "Email or password is invalid";
          res.redirect("/login");
        }
      } else {
        req.session.errorLogin = "invalid user name or password";
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
    }
  },

  getHomePage: async (req, res) => {
    let productDetails = await productSchema
      .find({ stock: { $gt: 0 }, status: true })
      .lean();
    let banner = await Banner.find().lean();
    console.log(banner, "banner");
    res.render("user/home", { user: req.session.user, productDetails, banner });
  },

  getUserLogout: (req, res) => {
    res.clearCookie("userJwt");
    res.redirect("/login");
  },

  getProfile: async (req, res) => {
    let userId = req.session.user._id;
    if (userId) {
      let user = await User.findById(userId).lean();
      let orderCount = await Order.find({ customerId: userId }).count().lean();
      console.log(orderCount, "count");
      if (user) {
        res.render("user/profile", { user: user, orderCount });
      } else {
        res.render("user/profile", { user: req.session.user._id, orderCount });
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  postProfile: async (req, res) => {
    console.log(req.body);
    let userData = req.body;
    let userId = req.session.user._id;
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { ...userData });
        res.redirect("/profile");
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getAddress: (req, res) => {
    res.render("user/address", { user: req.session.user });
  },

  postAddress: async (req, res) => {
    let userId = req.session.user._id;
    const { address, city, country, pincode } = req.body;
    if (userId) {
      try {
        let addressDetails = await User.findOneAndUpdate(
          { _id: userId },
          {
            $push: {
              addresses: [
                {
                  address: address,
                  city: city,
                  country: country,
                  pincode: pincode,
                },
              ],
            },
          }
        );
        res.redirect("/profile");
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getCheckout: async (req, res) => {
    const userId = req.session.user._id;
    if (userId) {
      try {
        const user = await User.findById(userId).lean();
        const total = await cartSchema
          .findOne(
            { user: req.session.user._id },
            {
              _id: false,
              totalAmount: true,
            }
          )
          .lean();
        res.render("user/checkout", { user: user, total: total.totalAmount });
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  getAllAddress: async (req, res) => {
    try {
      let userId = req.session.user._id;
      if (userId) {
        let addressDetails = await User.findById(userId).lean();
        res.render("user/allAddress", { user: addressDetails });
      } else {
        res.clearCookie("userJwt");
        res.redirect("/login");
      }
    } catch (error) {
      console.log(error);
    }
  },

  removeAddress: async (req, res) => {
    let addressId = req.params.id;
    let userId = req.session.user._id;
    if (userId) {
      try {
        if (!isValidObjectId(addressId)) {
          res.render("error", { user: req.session.user });
        } else {
          let addRemoved = await User.findByIdAndUpdate(userId, {
            $pull: {
              addresses: {
                _id: addressId,
              },
            },
          });
          if (addRemoved) {
            res.redirect("/profile");
          } else {
            res.redirect("/error");
          }
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  changePassword: (req, res) => {
    try {
      res.render("user/changePassword", {
        user: req.session.user,
        userEmail: req.session.user.email,
      });
    } catch (error) {
      console.log(error);
    }
  },

  editAddress: async (req, res) => {
    const addressId = req.params.id;
    if (req.session.user) {
      const userId = req.session.user._id;
      try {
        let userAddress = await User.findOne(
          { _id: userId },
          { _id: 0, addresses: { $elemMatch: { _id: addressId } } }
        ).lean();
        res.render("user/editAddress", { userAddress, user: req.session.user });
      } catch (error) {
        console.log(error);
      }
    } else {
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  },

  postEditAddress: async (req, res) => {
    const addressId = req.params.id;
    if (req.session.user) {
      const userId = req.session.user._id;
      try {
        let add = await User.findOneAndUpdate(
          {
            _id: userId,
            "addresses._id": new mongoose.Types.ObjectId(addressId),
          },
          {
            $set: {
              "addresses.$": { ...req.body },
            },
          }
        );
        res.redirect("/profile");
      } catch (error) {
        console.log(error);
      }
    }
  },
};
