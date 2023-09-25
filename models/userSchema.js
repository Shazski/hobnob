const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: Number, required: true },
  address: [
    {
      Address: { type: String },
      City: { type: String },
      Country: { type: String },
      Pincode: { type: String },
    },
  ],
  created: { type: String },
  refferalCode: { type: String },
  password: { type: String, required: true },
  blockStatus: { type: Boolean, required: true },
  wallet: { type: Number },
});

UserSchema.pre("save", function (next) {
  try {
    const salt = bcrypt.genSaltSync(10);

    const hashedPassword = bcrypt.hashSync(this.password, salt);

    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Users", UserSchema);
