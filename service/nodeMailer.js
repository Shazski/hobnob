const nodemailer = require("nodemailer");

module.exports = {

  sendEmail: (email,message) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ecommerce1419@gmail.com",
        pass: "iqtyaldszzgoweap",
      },
    });

    const mailOptions = {
      from: "youremail@gmail.com",
      to: email,
      subject: "Sending Email using Node.js",
      text: message,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return error
      } else {
        console.log("Email sent: " + info.response);
        return "success"
      }
    })
  },
};
