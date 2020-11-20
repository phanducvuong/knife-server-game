const DS              = require('../../repository/datastore');
const util            = require('../../utils/util');
const jwt             = require('../../utils/jwt');
const signinFunc      = require('../functions/signin_func');

const checkCodeRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token   = req.query.token;
      if (!await jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      rep.view('/partials/check_code_view.ejs');

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/check', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token   = headers.split(' ')[1];
      if (!await jwt.verify(token, signinFunc.SECRETE)) {
        throw `unvalid token`;
      }

      let code    = req.body.code.toString().trim();
      let result  = await DS.DSGetCode('codes_test', util.genEnterCode(code.toUpperCase()));

      if (result === null || result === undefined) throw `${code} is not exsit!`;

      let user      = (result['data']['name'] !== null && result['data']['name'] !== undefined) ? result['data']['name'] : '';
      let phone     = (result['data']['phone'] !== null && result['data']['phone'] !== undefined) ? result['data']['phone'] : '';
      let province  = (result['data']['province'] !== null && result['data']['province'] !== undefined) ? result['data']['province'] : '';
      let time      = (result['data']['time'] !== null && result['data']['time'] !== undefined) ? convertTimeToString(result['data']['time']) : '';

      rep.send({
        status_code : 2000,
        code        : code,
        used        : result['data']['used'],
        user        : user,
        phone       : phone,
        province    : province,
        time        : time
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

}

function convertTimeToString(milli) {
  let time    = new Date(milli + 7 * 3600 * 1000);
  let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
  let year    = time.getFullYear();
  let hour    = time.getHours() < 10 ? `0${time.getHours()}` : time.getHours();
  let minute  = time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes();
  // let second  = time.getSeconds();
  return `${date}/${month}/${year}  ${hour}:${minute}`;
}

module.exports = checkCodeRoute;