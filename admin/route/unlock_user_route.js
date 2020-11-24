const DS              = require('../../repository/datastore');
const redisClient     = require('../../redis/redis_client');
const profileFunc     = require('../../functions/profile_user_func');
const jwt             = require('../../utils/jwt');
const signinFunc      = require('../functions/signin_func');
const roleFunc        = require('../functions/role_func');

const unlockUserRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[4]['id'])) throw 'Permission denied!';

      rep.view('/partials/unlock_user_view.ejs');

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/get-user-by-mega-id', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[4]['id'])) throw 'Permission denied!';

      let megaID    = req.body.mega_id.toString().trim();
      let dataUser  = await DS.DSGetDataUser(megaID, 'turn_inven');

      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      let isLock = profileFunc.isBlockAcc(dataUser['block_acc']);
      rep.send({
        status_code : 2000,
        mega_id     : megaID,
        name        : dataUser['name'],
        status      : isLock['status']
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

  app.post('/unlock-user', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[4]['id'])) throw 'Permission denied!';

      let megaID    = req.body.mega_id.toString().trim();
      let dataUser  = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      dataUser['block_acc'] = profileFunc.resetBlockAccUser(dataUser['block_acc']);
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

      rep.send({
        status_code : 2000,
        msg         : 'Success',
        mega_id     : megaID,
        name        : dataUser['name'],
        status      : false
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

module.exports = unlockUserRoute;