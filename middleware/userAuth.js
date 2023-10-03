const { verify } = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userSchema");
const userAuth = (req, res, next) => {
  let token = req.cookies.userJwt;
  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.redirect("/login");
      } else {
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

const userValid = (req, res, next) => {
  let token = req.cookies.userJwt;

  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        next();
      } else {
        res.redirect("/");
      }
    });
  } else {
    next();
  }
};

const checkStatus = async (req, res, next) => {
  if(req.session.user) {
  const userId = req.session.user._id
  let userStatus = await User.findById(userId);
  if (userStatus) {
    if (userStatus.blockStatus === false) {
      next();
    } else {
      req.session.errorLogin = "you have been blocked by the admin";
      res.clearCookie("userJwt");
      res.redirect("/login");
    }
  } else {
    req.session.errorLogin = "you have been blocked by the admin";
    res.clearCookie("userJwt");
    res.redirect("/login");
  }
}else {
  res.clearCookie("userJwt")
  res.redirect('/login')
}
};

module.exports = { userAuth, userValid, checkStatus };
