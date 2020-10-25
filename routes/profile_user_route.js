const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');
const profileFunc   = require('../functions/profile_user_func');
const util          = require('../utils/util');
const logger        = require('fluent-logger');

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

      let histories = await redisClient.getHistoryUser(megaID);
      if (histories === null || histories === undefined || histories.length <= 0) {
        let tmpH = await DS.DSGetDataUser(megaID, 'histories');
        if (tmpH !== null && tmpH !== undefined) {
          histories = tmpH['history'];
        }
      }

      let resultFilterHis   = profileFunc.filterHistory(histories);
      let filterLsLuckyCode = profileFunc.convertLsLuckyCode(dataUser['lucky_code']);
      rep.send({
        status_code : 2000,
        lsGift      : resultFilterHis['ls_gift'],
        lsCard      : resultFilterHis['ls_card'],
        lsLuckyCode : filterLsLuckyCode,
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

  app.post('/check-sp-item', async (req, rep) => {
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
      if (!result['status'] || result['amount'] <= 0) throw result['msg'] + 'or amount <= 0';

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

  app.post('/enter-code', async (req, rep) => {
    try {

      // const platform  = req.body.platform.toString().trim();
      let token       = req.body.token.toString().trim();
      let megaID      = req.body.megaID.toString().trim();
      let code        = req.body.code.toString().trim();

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '') {
        throw `Check info user! ${megaID}`;
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist ${megaID}`;
      }

      let codes = await DS.DSGetDataGlobal('admin', 'enter_code');
      if (codes === null || codes === undefined || codes['codes'] === null || codes['codes'] === undefined) {
        throw `Array code not exist! ${code}`;
      }

      let result = util.isValidEntetCode(code, codes['codes']);
      if (!result['status']) throw `Invalid code! ${code}`;

      dataUser['turn'] += 1;
      dataUser['log_get_turn']['from_enter_code'].push(`${result['code']}_${dataUser['turn']}_1_${new Date().getTime()}`);

      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      DS.DSUpdateDataGlobal('admin', 'enter_code', { codes: result['lsEnterCode'] });

      //logger
      logger.emit('log', {
        action  : '[PROFILE][ENTER-CODE]',
        time    : new Date().toLocaleString(),
        detail  : 'enter code',
        data    : {
          mega_id   : megaID,
          code      : code
        }
      });

      rep.send({
        status_code : 2000,
        turn        : dataUser['turn']
      });

    }
    catch(err) {

      logger.emit('log', {
        action  : '[PROFILE][ENTER-CODE]',
        time    : new Date().toLocaleString(),
        detail  : err,
        data    : {}
      });

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/get-history-enter-code', async (req, rep) => {
    try {

       let token       = req.body.token.toString().trim();
       let megaID      = req.body.megaID.toString().trim();
 
       if (token   === null || token   === undefined || token  === '' ||
           megaID  === null || megaID  === undefined || megaID === '') {
         throw `Check info user! ${megaID}`;
       }
 
       let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
       if (dataUser === null || dataUser === undefined) {
         dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
         if (dataUser === null || dataUser === undefined) throw `User not exist ${megaID}`;
       }

       let result = profileFunc.getHistoryEnterCode(dataUser['log_get_turn']['from_enter_code']);
       rep.send({
        status_code : 2000,
        result      : result
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