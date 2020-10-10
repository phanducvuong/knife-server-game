const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');
const profileFunc   = require('../functions/profile_user_func');

const profileUserRoute = async (app, opt) => {

  app.post('/get-history', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '') {
        throw 'Check info user!';
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist ${megaID}`;
      }

      let resultFilterHis = profileFunc.filterHistory(dataUser['inven']);
      rep.send({
        status_code : 2000,
        lsGift      : resultFilterHis['lsGift'],
        lsCard      : resultFilterHis['lsCard'],
        lsLuckyCode : dataUser['lucky_code'],
        name        : dataUser['name'],
        turn        : dataUser['turn']
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

  app.post('/get-notifica-banner', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '') {
        throw 'Check info user!';
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist ${megaID}`;
      }

      let arrNotificaBanner = await profileFunc.getNotificaBanner();
      rep.send({
        status_code : 2000,
        result      : arrNotificaBanner
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

  app.post('/get-sp-item', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '') {
        throw 'Check info user!';
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist ${megaID}`;
      }

      let result = profileFunc.getSpItemById(dataUser['sp_item'], 0);
      if (!result['status']) throw result['msg'];

      rep.send({
        status_code : 2000,
        amount      : result['amount']
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

module.exports = profileUserRoute;