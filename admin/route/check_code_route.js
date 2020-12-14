const DS              = require('../../repository/datastore');
const util            = require('../../utils/util');
const jwt             = require('../../utils/jwt');
const signinFunc      = require('../functions/signin_func');
const roleFunc        = require('../functions/role_func');
const chkCodeFunc     = require('../functions/check_code_func');

const checkCodeRoute = async (app, opt) => {

  //check code get turn
  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[2]['id'])) throw 'Permission denied!';

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

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[2]['id'])) throw 'Permission denied!';

      let code    = req.body.code.toString().trim();
      let result  = await DS.DSGetCode('codes', util.genEnterCode(code.toUpperCase()));

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

  //get the best top enter code
  app.get('/view-top-enter-code-by-province', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[9]['id'])) throw 'Permission denied!';

      let date = new Date();
      date.setHours(0, 0, 0, 0);

      let result = await chkCodeFunc.getTopEnterCodeByProvince(date, date);

      rep.view('/partials/top_enter_code_by_province.ejs', {
        data  : result
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/top-enter-code-by-province', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[9]['id'])) throw 'Permission denied!';

      let fromDate    = req.body.from_date.toString().trim();
      let toDate      = req.body.to_date.toString().trim();
      let tmpDateF    = new Date(fromDate);
      let tmpDateT    = new Date(toDate);
      if (isNaN(tmpDateF.getTime()) ||  isNaN(tmpDateT.getTime()) || 
          tmpDateF.getTime()        >   tmpDateT.getTime()) {
        throw `Invalid date!`;
      }
      tmpDateF.setHours(0, 0, 0, 0);
      tmpDateT.setHours(0, 0, 0, 0);

      let result = await chkCodeFunc.getTopEnterCodeByProvince(tmpDateF, tmpDateT);
      rep.send({
        status_code : 2000,
        result      : result
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

//--------------------------------------------------------------function---------------------------------------------------------------------

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