let Cart = require('../models/cartSchema')

module.exports = {
    getCartCount : async(req, res) => {
        return await Cart.find({user: req.session.user._id}).count().lean()
    }
}