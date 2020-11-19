const userInfoFunc            = require('../functions/user_info_func');
const jwt                     = require('../../utils/jwt');
const signinFunc              = require('../functions/signin_func');

const userInfoRoute = async (app, opt) => {

  app.get('/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsAllUserInfo = await userInfoFunc.getAllUser();
      rep.view('/partials/user_info_view.ejs', {
        data: lsAllUserInfo
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/detail', async (req, rep) => {
    try {

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

  app.get('/general/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
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

  app.get('/turnning/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsAllDataUser     = await userInfoFunc.getAllDataUser();
      let lsHistoryAllUser  = await userInfoFunc.getHistoryAllUser(lsAllDataUser);
      let result            = userInfoFunc.getTurnningInfo(lsHistoryAllUser);
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

  app.get('/enter-code/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
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

  app.get('/get-log-code-fail/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
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