const userInfoFunc            = require('../functions/user_info_func');

const userInfoRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

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

}

module.exports = userInfoRoute;