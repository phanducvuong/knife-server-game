const request     = require('request')

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_pro');
}
else {
  config = require('../config_dev');
}

const verifyUserRoute = async (app, opt) => {

  app.post('/verify-user', async (req, rep) => {
    
    try {

      const token   = req.body.token.toString().trim();
      const result  = await verifyTokenUser(token);

      if (result === null || result === undefined) {
        throw 'can not verify user';
      }

      rep.send({
        status_code : 2000,
        result      : result
      });

    }
    catch(err) {

      rep.send({
        status_code : 3000,
        error       : err
      });

    }

  });

}

module.exports = verifyUserRoute;

function verifyTokenUser(token) {
  return new Promise((resv, rej) => {

    request.post({
      headers : {
        'Authorization': `Bearer ${token}`
      },
      url     : config.URL_VALID_TOKEN
    }, (err, res, body) => {

      if (err) return rej(err)

      let jsonData = JSON.parse(body);
      if (jsonData.code !== 2000) {
        return rej('can not verify user');
      }
      return resv(jsonData.data);

    });

  });
}