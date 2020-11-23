const userInfoFunc            = require('../functions/user_info_func');
const jwt                     = require('../../utils/jwt');
const signinFunc              = require('../functions/signin_func');

const userInfoRoute = async (app, opt) => {

  // app.get('/', async (req, rep) => {
  //   try {

  //     let token   = req.query.token;
  //     if (!await jwt.verify(token, signinFunc.SECRETE)) {
  //       rep.redirect('/api/v1/admin/signin');
  //       return;
  //     }

  //     let lsAllUserInfo = await userInfoFunc.getAllDataUser();
  //     rep.view('/partials/user_info_view.ejs', {
  //       data: lsAllUserInfo
  //     });

  //   }
  //   catch(err) {

  //     rep.view('/partials/error_view.ejs', {
  //       title_error : err
  //     });

  //   }
  // });

  app.post('/detail', async (req, rep) => {
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

      let megaID = req.body.mega_id.toString().trim();
      if (megaID === null || megaID === undefined) throw 'MegaID is invalid!';

      let result = await userInfoFunc.getDetailInfoUser(megaID);
      if (!result['status']) throw result['msg'];

      rep.send({
        status_code           : 2000,
        detail_get_bonus_turn : result['detailGetBonusTurn'],
        detail_ls_gift        : result['lsGift'],
        detail_ls_tele_card   : result['lsTeleCard']
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

  app.get('/general', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsAllDataUser = await userInfoFunc.getAllDataUser();
      let lsGeneral     = userInfoFunc.getGeneralInfo(lsAllDataUser);
      rep.view('/partials/user_general_info_view.ejs', {
        data: lsGeneral
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.get('/turnning', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsAllDataUser     = await userInfoFunc.getAllDataUser();
      let lsHistoryAllUser  = await userInfoFunc.getHistoryAllUser(lsAllDataUser);
      let result            = userInfoFunc.getTurnningInfo(lsHistoryAllUser);
      result                = userInfoFunc.getSpecialItemsAllUser(lsAllDataUser, result);
      let items             = userInfoFunc.getAllNameOfLsItems();

      rep.view('/partials/user_info_turnning_view.ejs', {
        data  : result,
        items : items
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.get('/enter-code', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsAllDataUser = await userInfoFunc.getAllDataUser();
      let result        = userInfoFunc.getEnterCodeInfo(lsAllDataUser);
      rep.view('/partials/user_enter_code_view.ejs', {
        data  : result
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.get('/get-log-code-fail', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let result = await userInfoFunc.getAllCodeFail();
      rep.view('/partials/user_enter_code_fail_view.ejs', {
        data  : result
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });
}

module.exports = userInfoRoute;