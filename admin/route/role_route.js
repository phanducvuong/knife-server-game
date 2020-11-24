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
const DS                  = require('../../repository/datastore');

const roleRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;

      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[7]['id'])) throw 'Permission denied!';

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

  app.post('/get-user-by-mailer', async (req, rep) => {
    try {

      let mailer  = req.body.mailer.toString().trim();
      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) throw `Unvalid token!`;

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[7]['id'])) throw 'Permission denied!';

      let mailerDS = await DS.DSGetMailer('administrators', mailer);
      if (mailerDS === null || mailerDS === undefined) throw `${mailerDS} is not exist!`;

      let code = 2000;
      if (mailer === resultVerify['mailer']['mail']) {
        code = 2100;
      }

      rep.send({
        status_code : code,
        full_ctr    : roleFunc.isFullControl(mailerDS['role']),
        roles       : mailerDS['role'],
        mailer      : mailerDS['mail'],
        name        : mailerDS['name'],
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

  app.post('/add-role', async (req, rep) => {
    try {

      let mailer        = req.body.mailer.toString().trim();
      let name          = req.body.name.toString().trim();
      let roles         = req.body.roles;

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) throw 'unvalid token!';

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[7]['id'])) throw 'Permission denied!';

      let mailerDS = await DS.DSGetMailer('administrators', mailer);
      if (mailerDS !== null && mailerDS !== undefined) throw `${mailer} is exist!`;

      let resultChkRoleRequest = roleFunc.chkRolesRequest(roles);
      if (resultChkRoleRequest.length <= 0) throw 'Role is not except!';

      DS.DSUpdateDataGlobal('administrators', mailer, {
        mail  : mailer,
        role  : resultChkRoleRequest,
        name  : name,
        token : ''
      });

      rep.send({
        status_code : 2000,
        msg         : 'Success!'
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

  app.post('/edit-role', async (req, rep) => {
    try {

      let mailer        = req.body.mailer.toString().trim();
      let name          = req.body.name.toString().trim();
      let roles         = req.body.roles;

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) throw 'unvalid token!';

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[7]['id'])) throw 'Permission denied!';

      let mailerDS = await DS.DSGetMailer('administrators', mailer);
      if (mailerDS === null || mailerDS === undefined) throw `${mailer} is not exist!`;

      if (mailerDS['mail'] === resultVerify['mailer']['mail']) throw 'Can not edit yourself!';

      let resultChkRoleRequest = roleFunc.chkRolesRequest(roles);
      if (resultChkRoleRequest.length <= 0) throw 'Role is not except!';

      DS.DSUpdateDataGlobal('administrators', mailer, {
        mail  : mailer,
        role  : resultChkRoleRequest,
        name  : name,
        token : mailerDS['token']
      });

      rep.send({
        status_code : 2000,
        msg         : 'Success!'
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

  app.post('/del-role-user', async (req, rep) => {
    try {

      let mailer        = req.body.mailer.toString().trim();

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) throw 'unvalid token!';

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[7]['id'])) throw 'Permission denied!';

      let mailerDS = await DS.DSGetMailer('administrators', mailer);
      if (mailerDS === null || mailerDS === undefined) throw `${mailer} is not exist!`;

      if (mailerDS['mail'] === resultVerify['mailer']['mail']) throw 'Can not edit yourself!';

      DS.DSDeleteUserRole('administrators', mailer);
      rep.send({
        status_code : 2000,
        msg         : 'Success!'
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

module.exports = roleRoute;