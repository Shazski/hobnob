const bcrypt = require("bcrypt");

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const matchPassword = (passwordUser, passwordData) => {
  return bcrypt.compareSync(passwordUser, passwordData);
};

module.exports = { hashPassword, matchPassword };
