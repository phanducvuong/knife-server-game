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
        return rej('Can not verify user');
      }
      return resv(jsonData.data);
      // return resv(jsonData);

    });

  });
}

exports.checkDateIsExistIn = (millisecond, lsDateLogin) => {
  let date1 = new Date(millisecond);
  let date2 = new Date();
  for (d of lsDateLogin) {
    date2.setTime(d);
    if (date1.getDate()     === date2.getDate()   &&
        date1.getMonth()    === date2.getMonth()  &&
        date1.getFullYear() === date2.getFullYear()) {

      return true;

    }
  }
  return false;
}