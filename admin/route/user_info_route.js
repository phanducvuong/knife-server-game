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

}

module.exports = userInfoRoute;