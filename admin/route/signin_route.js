const signinFunc          = require('../functions/signin_func');
const jwt                 = require('../../utils/jwt');
const sendMail            = require('../../utils/send_mail');

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

  app.post('/signin', async (req, rep) => {
    try {

      let mailer = req.body.mailer.toString().trim();
      if (!signinFunc.ARR_ADMIN.includes(mailer)) throw 'Permission denied!';

      let result = jwt.sign(mailer, signinFunc.SECRETE);
      sendMail.sendTokenForMailer(result, mailer);
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

}

module.exports = signinRoute;