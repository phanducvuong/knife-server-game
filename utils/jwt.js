const jwt             = require('jsonwebtoken');
const signinFunc      = require('../admin/functions/signin_func');
const DS              = require('../repository/datastore');

exports.sign = (mailer, secret) => {
  let result = jwt.sign({ mailer: mailer }, secret, { expiresIn: '12h' });
  return result;
}

exports.verify = async (token, secret) => {
  try {
    let decode    = jwt.verify(token, secret);
    let mailerDS  = await DS.DSGetMailer('administrators', decode['mailer']);
    if (mailerDS !== null  && mailerDS !== undefined && mailerDS['token'] === token) {
      return {
        status  : true,
        mailer  : mailerDS
      };
    }
    return { status: false };
  }
  catch(err) {
    return { status: false };
  }
}