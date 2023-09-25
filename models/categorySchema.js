const mongoose = require("mongoose");

const { Schema } = mongoose;

const categorySchema = new Schema({
  category: { type: String, required: true, unique: true },
  created: { type: String },
});

module.exports = mongoose.model("category", categorySchema);
