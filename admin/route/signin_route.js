const signinFunc          = require('../functions/signin_func');
const jwt                 = require('../../utils/jwt');
const sendMail            = require('../../utils/send_mail');
const DS                  = require('../../repository/datastore');
const roleFunc            = require('../functions/role_func');
const log                 = require('../../utils/log');

const signinRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      rep.view('/partials/signin_view.ejs');

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/signin_view.ejs');

    }
  });

  app.post('/get-token', async (req, rep) => {
    try {

      let mailer    = req.body.mailer.toString().trim();
      let mailerDS  = await DS.DSGetMailer('administrators', mailer);
      if (mailerDS === null || mailerDS === undefined) throw 'Permission denied!';

      let result = jwt.sign(mailer, signinFunc.SECRETE);
      sendMail.sendTokenForMailer(result, mailer);

      DS.DSUpdateDataGlobal('administrators', mailer, {
        mail  : mailer,
        name  : mailerDS['name'],
        token : result,
        role  : mailerDS['role']
      });

      rep.send({
        status_code : 2000
      });

    }
    catch(err) {

      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/sign-in', async (req, rep) => {
    try {

      let token   = req.body.token;
      let result  = await jwt.verify(token, signinFunc.SECRETE);
      if (!result['status']) throw 'Signin Failed!';

      log.logAdminTool('SIGN-IN', result['mailer'], { mailer: result['mailer']['mail'] });

      let roleFind = roleFunc.GETROLES().find(e => { return e['id'] === result['mailer']['role'][0] });
      rep.send({
        status_code : 2000,
        token       : token,
        mailer      : req.body.mailer,
        redirect    : roleFind['redirect']
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

  app.post('/logout', async (req, rep) => {
    try {

      let mailer    = req.body.mailer.toString().trim();
      let mailerDS  = await DS.DSGetMailer('administrators', mailer);

      DS.DSUpdateDataGlobal('administrators', mailer, {
        mail  : mailer,
        token : '',
        name  : mailerDS['name'],
        role  : mailerDS['role']
      });

      rep.send({
        status_code : 2000
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

module.exports = signinRoute;