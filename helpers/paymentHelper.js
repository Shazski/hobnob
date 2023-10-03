const Payment = require("../models/paymentSchema");

module.exports = {
    addPayment: async(user,amount, paymentMode) => {
        console.log(paymentMode,amount,user)
       const userExist =  await Payment.findOne({user:user})
        if(userExist) {
            await Payment.findOneAndUpdate({user:user},{
                $push:{
                    payments: [{
                        payment:{
                            amount:amount,
                            paymentDate: new Date().toLocaleDateString(),
                            paymentMode:paymentMode
                        }
                    }]
                }
            })
        } else {
            await Payment.create({
                payments:[{
                    payment:{
                        amount:amount,
                        paymentDate:new Date().toLocaleDateString(),
                        paymentMode:paymentMode
                    }
                }],
                user: user
            })
        }
    }
}