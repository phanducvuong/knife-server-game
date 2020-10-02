const request             = require('request');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.verifyTokenUser = (token) => {
  return new Promise((resv, rej) => {
  
    request.post({
      headers : {
        'Authorization': `Bearer ${token}`
      },
      url     : config.URL_VALID_TOKEN
    }, (err, res, body) => {

      if (err) return rej(err);

      let jsonData = JSON.parse(body);
      if (jsonData.code !== 2000) {
        console.log(jsonData);
        return rej('can not verify user');
      }
      return resv(jsonData);

    });

  });
}