const express = require("express");
const hbs = require("express-handlebars");
const session = require("express-session");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const cron = require('node-cron');
const userRouter = require("./routers/userRouter");
const adminRouter = require("./routers/adminRouter");
const noCache = require("nocache");
const productSchema = require("./models/productSchema");
require("dotenv").config();
require("./config/connection");
const PORT = process.env.PORT || 3001;

//setting cron-job for product price update
cron.schedule('*/2 * * * *', async () => {
  console.log('Running cron job to update offer prices...');
  let productDetails = await productSchema.find()
  let currDate = new Date();
      for (const product of productDetails) {
        await productSchema.findOneAndUpdate(
          {
            offerExpiryDate: { $lt: currDate },
          },
          { offerPrice: product.basePrice }
        );
      }
});

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
app.use("*", (req, res) => res.render('error'))

//server creating
app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
