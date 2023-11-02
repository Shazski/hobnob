const express = require("express");
const hbs = require("express-handlebars");
const session = require("express-session");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const userRouter = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");
const noCache = require("nocache");
require('./helpers/ProductCronJob')
require("dotenv").config();
require("./config/connection");
const PORT = process.env.PORT || 3001;

//setting cron-job for product price update



//logger
app.use(logger("dev"));

//session storage
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

//cache clear
app.use(noCache());

//view engine setup
app.set("view engine", "hbs");
app.engine(
  
  "hbs",
  hbs.engine({
    extname: ".hbs",
    helpers: {
      formatDate: function(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    },
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials",
  })
);

//body parser setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//static page setup
app.use(express.static("public"));

//router middleware
app.use("/admin", adminRouter);
app.use("/", userRouter);
app.use("*", (req, res) => res.render("error"));

//server creating
app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
