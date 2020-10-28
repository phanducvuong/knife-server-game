const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');
const profileFunc   = require('../functions/profile_user_func');
const util          = require('../utils/util');
const logger        = require('fluent-logger');
const generateStr   = require('../utils/generate_string');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

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

      let platform    = req.body.platform;
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

      //bonus by condition
      let date          = new Date();
      if (dataUser['log_get_turn']['from_enter_code'].length % 2 === 0) {
        dataUser['turn'] += config.BONUS_ENTER_CODE['bonus_1']['bonus_turn'];
        if (config.BONUS_ENTER_CODE['bonus_1']['bonus_sp_item'] > 0) {
          let str = generateStr.getStringGenerate();
          dataUser['lucky_code'].push(`${str}_${date.getTime()}`);
        }
      }
      else {
        dataUser['turn'] += config.BONUS_ENTER_CODE['bonus_2']['bonus_turn'];
        if (config.BONUS_ENTER_CODE['bonus_2']['bonus_sp_item'] > 0) {
          let str = generateStr.getStringGenerate();
          dataUser['lucky_code'].push(`${str}_${date.getTime()}`);
        }
      }
      dataUser['log_get_turn']['from_enter_code'].push(`${result['code']}_${dataUser['turn']}_1_${date.getTime()}`);

      if (util.isEligibleEventById0(config.EVENTS['data'][0]['from_date'], config.EVENTS['data'][0]['to_date'])) {
        dataUser['events'][0] += 1;
      } //cập nhật events nếu events đang diễn ra

      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      DS.DSUpdateDataGlobal('admin', 'enter_code', { codes: result['lsEnterCode'] });

      //logger
      logger.emit('log', {
        action  : '[PROFILE][ENTER-CODE]',
        time    : date.toLocaleString(),
        detail  : 'enter code',
        data    : {
          mega_id   : megaID,
          code      : code
        }
      });

      let app_id  = '5f758539deed4200bc1cfe20';
      if (platform === 'ios') {
        app_id  = '5f7585522f638b00cf560e22';
      }

      let dataLog = {
        "advertiser_id": dataUser['userID'],
        "android_id": "",
        "app_code": "",
        "app_id": app_id,
        "app_key": "21d7a592e0845117c8dba8e3bc94e869",
        "app_version": "1.0.0",
        "brand": "",
        "bundle_identifier": "",
        "carrier": "",
        "country_code": "VN",
        "cpu_abi": "",
        "cpu_abi2": "",
        "device": "",
        "device_model": "",
        "device_type": "user",
        "display": "",
        "event_value": { "login_count": 0, "price": 0, "success": true },
        "fcm": "",
        "finger_print": "",
        "install_time": "",
        "language": "Tiếng Việt",
        "last_update_time": "",
        "operator": "",
        "os_version": "",
        "platform": platform,
        "product": "",
        "sdk": "23",
        "sdk_version": "1.0.0",
        "server_timestamp": date.getTime(),
        "time_zone": "UTC",
        "timestamp": date.getTime()
      }

      logger.emit('log', {
        action  : '[KPI][GET-SDK]',
        time    : date.toLocaleString(),
        detail  : 'get SDK log',
        data    : {
          "app_id": app_id,
          "app_key": "21d7a592e0845117c8dba8e3bc94e869",
          "data": dataLog,
          "event_type": "6",
          "event_value": {
            "quantity": 1
          },
          "user_id": dataUser['userID']
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