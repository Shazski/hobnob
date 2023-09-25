const otpGenerator = require('otp-generator')

module.exports = {

    generateOtp: () => {
      return  otpGenerator.generate(4,{ upperCaseAlphabets: false, specialChars: false,lowerCaseAlphabets:false})
    }
}
