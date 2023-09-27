const Admin = require("../models/adminSchema");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userSchema");
const generatePages = require("../service/pageGenerator");

module.exports = {
  getAdminLogin: (req, res) => {
    res.render("admin/adminLogin", { adminError: req.session.adminError });
  },

  postAdminLogin: async (req, res) => {
    const { userName, password } = req.body;
    console.log(req.body, "body");
    let adminExists = await Admin.findOne({ userName: userName });

    if (adminExists) {
      let passwordTrue = bcrypt.compareSync(password, adminExists.password);
      if (passwordTrue) {
        req.session.adminError = "";
        let updateAdminLogin = await Admin.findOneAndUpdate(
          { userName: userName },
          { lastLogin: new Date() }
        );
        console.log(updateAdminLogin, "update time");
        if (updateAdminLogin) {
          if (updateAdminLogin.role === "superAdmin") {
            let superAdminToken = sign(
              { id: updateAdminLogin._id, userName: updateAdminLogin.userName },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.cookie("adminJwt", superAdminToken, { maxAge: 3600000 });
            req.session.superAdmin = true;
            res.redirect("/admin/admin-panel");
          } else if (updateAdminLogin.role === "subAdmin") {
            let subAdminToken = sign(
              { id: updateAdminLogin._id, userName: updateAdminLogin.userName },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.cookie("adminJwt", subAdminToken, { maxAge: 3600000 });
            req.session.subAdmin = true;
            res.redirect("/admin/admin-panel");
          }
        }
      } else {
        req.session.adminError = "admin is not valid";
        res.redirect("/admin/login");
      }
    } else {
      req.session.adminError = "admin is not valid";
      res.redirect("/admin/login");
    }
  },

  getAdminPanel: (req, res) => {
    res.render("admin/userManagement", {
      superAdmin: true,
      subAdmin: true,
    });
  },

  getUserDetails: async (req, res) => {
    try {
      let search = req.query.search || "";
      const userCount = await User.find({
        name: { $regex: new RegExp(`^${search}`, "i") },
      }).count();
      const pages = generatePages.generatePageNumbers(userCount);
      let page = parseInt(req.query.page) || 1;
      const hasPrev = page >= 1;
      const hasNext = page < pages.length;
      const prevPage = hasPrev ? page - 1 : 1;
      const nextPage = hasNext ? page + 1 : pages;
      const userDetails = await User.find({
        name: { $regex: new RegExp(`^${search}`, "i") },
      })
        .skip((page - 1) * 10)
        .limit(10)
        .lean();
      res.render("admin/userManagement", {
        superAdmin: true,
        subAdmin: true,
        search,
        pages,
        userDetails,
        prevPage,
        nextPage,
        hasPrev,
        hasNext,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getBlockUser: async (req, res) => {
    try {
      let userId = req.params.id;
      let user = await User.findById(userId);
      let blockData = !user.blockStatus;
      let data = await User.findByIdAndUpdate(userId, {
        blockStatus: blockData,
      });
      console.log(data, "blocked data");
      res.redirect("/admin/user-management");
    } catch (error) {
      console.log(error);
    }
  },

  adminLogout: (req, res) => {
    res.clearCookie("adminJwt");
    res.redirect("/admin/login");
  }
};
