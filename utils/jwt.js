const jwt             = require('jsonwebtoken');
const signinFunc      = require('../admin/functions/signin_func');

exports.sign = (mailer, secret) => {
  let result = jwt.sign({ mailer: mailer }, secret, { expiresIn: '24h' });
  return result;
}

exports.verify = (token, secret) => {
  try {
    let decode = jwt.verify(token, secret);
    if (signinFunc.ARR_ADMIN.includes(decode['mailer'])) {
      return true;
    }
    return false;
  }
  catch(err) {
    return false;
  }
}