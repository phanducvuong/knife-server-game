const jwt                     = require('../../utils/jwt');
const userInfoFunc            = require('../function_cache/user_info_func_cache');
const signinFunc              = require('../functions/signin_func');
const roleFunc                = require('../functions/role_func');

const luckyCodeRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[8]['id'])) throw 'Permission denied!';

      let result = await userInfoFunc.getAllLuckyCode();
      rep.view('/partials/lucky_code_view.ejs', {
        data: result
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

}

module.exports = luckyCodeRoute;