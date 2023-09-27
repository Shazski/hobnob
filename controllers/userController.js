const otpGenerator = require("../service/otpGenerator");
const mail = require("../service/nodeMailer");
const Otp = require("../models/otpSchema");
const User = require("../models/userSchema");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
const hashpassword = require("../service/hashPassword");
const productSchema = require("../models/productSchema");

module.exports = {
  getUserLogin: (req, res) => {
    res.render("user/userLogin", { errorLogin: req.session.errorLogin });
  },

  getUserSignUp: (req, res) => {
    res.render("user/userSignUp", { error: req.session.error });
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
          created: new Date().toLocaleDateString()
        });

        if (userId) {
          let token = sign(
            { userId: userId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
          );
          res.cookie("userJwt", token, { maxAge: 3600000 });
          req.session.user = userId
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
    if (req.session.forgotOtp) {
      res.render("user/changePassword", {
        userEmail: req.session.userEmail,
        matchError: req.session.matchError,
      });
    } else {
      req.session.error = "enter email and otp for change password";
      res.redirect("/forgot-password");
    }
  },

  postChangePassword: async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.session.matchError = "password is not matching";
      res.redirect("/change-password");
    } else {
      const hashedPassword = hashpassword.hashPassword(newPassword);
      await User.findOneAndUpdate(
        { email: email },
        { password: hashedPassword }
      );

      req.session.matchError = "";
      res.redirect("/login");
    }
  },

  postUserLOgin: async (req, res) => {
    const { email, password } = req.body;
    let existingUser = await User.findOne({ email: email });

    try {
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
      }
    } catch (error) {
      console.log(error);
    }
  },

  getHomePage: async(req, res) => {
   let productDetails = await productSchema.find({stock:{$gt:0},status:true}).lean()
    res.render("user/home", { user: req.session.user,productDetails});
  },

  getUserLogout: (req, res) => {
    res.clearCookie("userJwt");
    res.redirect("/login");
  },
};
