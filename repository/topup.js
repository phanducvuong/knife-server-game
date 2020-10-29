const crypto      = require('crypto');
const request     = require('request');
const logger      = require('fluent-logger');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.requestTopupCardPhone = (amountCard, phoneNumber, megaID) => {
  let date    = new Date();
  let refCode = `ref_code_${date.getTime()}_${megaID}`;
  request.post({
    url   : config.URL_TOPUP,
    proxy : 'http://10.34.0.29:3128',
    json  : true,
    body  : {
      app_id        : config.APP_ID_TOPUP,
      amount        : amountCard,
      phone_number  : phoneNumber,
      signature     : genSignature(config.PRIVATE_KEY_TOPUP, phoneNumber, amountCard, refCode),
      ref_code      : refCode
    }
  }, (err, response, body) => {

    if (err) {
      logger.emit('log', {
        action    : '[WHEEL][GET-ITEM][TOPUP]',
        time      : new Date().toLocaleString(),
        detail    : 'error when call api topup',
        data      : err
      }); //logger
    }
    else {
      logger.emit('log', {
        action    : '[WHEEL][GET-ITEM][TOPUP]',
        time      : new Date().toLocaleString(),
        detail    : 'user get card mobile when call get-item',
        data      : body
      }); //logger
    }

  });
}

exports.requestTopupCardPhoneTEST = (amountCard, phoneNumber, megaID) => {
  return new Promise((resv, rej) => {
    let date    = new Date();
    let refCode = `ref_code_${date.getTime()}_${megaID}`;
    request.post({
      url   : config.URL_TOPUP,
      json  : true,
      proxy : 'http://10.34.0.29:3128',
      body  : {
        app_id        : config.APP_ID_TOPUP,
        amount        : amountCard,
        phone_number  : phoneNumber,
        signature     : genSignature(config.PRIVATE_KEY_TOPUP, phoneNumber, amountCard, refCode),
        ref_code      : refCode
      }
    }, (err, response, body) => {

      if (err) {
        logger.emit('log', {
          action    : '[WHEEL][GET-ITEM][TOPUP]',
          time      : new Date().toLocaleString(),
          detail    : 'error when call api topup',
          data      : err
        }); //logger
      }
      else {
        logger.emit('log', {
          action    : '[WHEEL][GET-ITEM][TOPUP]',
          time      : new Date().toLocaleString(),
          detail    : 'user get card mobile when call get-item',
          data      : body
        }); //logger
      }
      
      if (err) return rej(err);
      return resv(body);

    });
  });
}

//-------------------------------------------------------functional---------------------------------------
function genSignature(privateKey, phoneNumber, amount, refCode) {
  let str = `${privateKey}${phoneNumber}${amount}${refCode}${privateKey}`;
  return crypto.createHash('sha512').update(str).digest('hex');
}