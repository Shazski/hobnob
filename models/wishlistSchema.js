const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const WishlistSchema = new Schema({
     products: [{ type: Schema.Types.ObjectId, ref:"Products" }],
     user: { type: Schema.Types.ObjectId },
});

module.exports = mongoose.model('Wishlist', WishlistSchema);


