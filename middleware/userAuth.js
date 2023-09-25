const { verify } = require("jsonwebtoken");
require("dotenv").config();

const userAuth = (req, res, next) => {
  let token = req.cookies.userJwt;

  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.redirect("/login");
      } else {
        next()
      }
    })
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

module.exports = { userAuth, userValid };
