const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const { Schema } = mongoose;

const AdminSchema = new Schema(
  {
    userName: { type: String, unique: true },
    password: { type: String },
    role: { type: String },
    lastLogin: { type: Date },
    email: { type: String, unique: true },
    status: { type: String },
  },
  { Timestamps: true }
);

AdminSchema.pre("save", function(next){
  try {
    const hashedPassword = bcrypt.hashSync(this.password, 10);
    
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
})

module.exports = mongoose.model("Admin", AdminSchema);
