const { verify } = require("jsonwebtoken")

require("dotenv").config();

const adminAuth = (req, res, next) => {
  let token = req.cookies.adminJwt;

  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.redirect("/admin/login");
      } else {
        next()
      }
    })
  } else {
    res.redirect("/admin/login");
  }
};

const adminValid = (req, res, next) => {
  let token = req.cookies.adminJwt;

  if (token) {
    verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        next();
      } else {
        console.log("admin valid");
        res.redirect("/admin/admin-panel");
      }
    });
  } else {
    next();
  }
};

module.exports = { adminAuth, adminValid };
