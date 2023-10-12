const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const BannerSchema = new Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
});

module.exports = mongoose.model('Banner', BannerSchema);


