/**
 * rule permission admin tool
 * 0 -> tab trang chủ
 * 1 -> tab danh sách vật phẩm
 * 2 -> tab kiểm tra mã dự thưởng
 * 3 -> tab thêm quà đặc biệt
 * 4 -> tab mở khóa acc
 * 5 -> tab thông tin user
 * 6 -> tab config
 * 7 -> tab permission
 * 
 * index tại mảng roles ở roleFunc sẽ trùng với 0 -> 7
 */

const roleFunc            = require('../functions/role_func');
const signinFunc          = require('../functions/signin_func');
const jwt                 = require('../../utils/jwt');

const ROLE_NUMBER         = 7;

const roleRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;

      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(ROLE_NUMBER)) throw 'Permission denied!';

      let result = await roleFunc.getAllUserAdmin();
      rep.view('/partials/role_view.ejs', {
        roles : roleFunc.GETROLES(),
        data  : result
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/edit-role', async (req, rep) => {
    try {

      let mailer        = req.body.mailer.toString().trim();
      let roles         = req.body.roles;

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

module.exports = roleRoute;