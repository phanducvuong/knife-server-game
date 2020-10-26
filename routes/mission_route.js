const redis             = require('../redis/redis_client');
const DS                = require('../repository/datastore');
const missionFunc       = require('../functions/mission_func');
const logger            = require('fluent-logger');

const missionRoute = async (app, opt) => {

  app.post('/get-all-mission', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();

      let dataUser = JSON.parse(await redis.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `Can not get dataUser by ${megaID}!`;
      }

      if (dataUser['token'] !== token) throw 'Invalid token user!';

      let filterMission = missionFunc.filterMisisonWithSpItem(dataUser['mission'], dataUser['actions']);
      rep.send({
        status_code : 2000,
        missions    : filterMission
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

  app.post('/join-mission', async (req, rep) => {
    try {

      const platform  = req.body.platform;
      const token     = req.body.token.toString().trim();
      const megaID    = req.body.megaID.toString().trim();
      const idMission = parseInt(req.body.idMission, 10);

      if (isNaN(idMission)) throw `Invalid id mission!`;

      let dataUser = JSON.parse(await redis.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist with ${megaID}!`;
      }

      if (dataUser['token'] !== token) throw `Invalid token! ${megaID}`;

      let bonusFromMission = missionFunc.getBonusFromMission(idMission, dataUser);
      if (bonusFromMission['status'] === false) {
        rep.send({
          status_code : 2500,
          msg         : bonusFromMission['msg']
        });
        return;
      }

      let missionFilter = missionFunc.filterMisisonWithSpItem(bonusFromMission['dataUserUpdate']['mission'], bonusFromMission['dataUserUpdate']['actions']);
      DS.DSUpdateDataUser(megaID, 'turn_inven', bonusFromMission['dataUserUpdate']);
      redis.updateTurnAndInvenUser(megaID, JSON.stringify(bonusFromMission['dataUserUpdate']));

      //logger
      let date = new Date();
      logger.emit('log', {
        action  : '[MISSION][JOIN-MISSION]',
        time    : date.toLocaleString(),
        detail  : 'join mission',
        data    : {
          id_mission  : idMission,
          user_id     : megaID,
          bonus       : bonusFromMission['bonusStr'],
          new_turn    : bonusFromMission['dataUserUpdate']['turn']
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
          "event_type": "8",
          "event_value": {
            "id": idMission
          },
          "user_id": dataUser['userID']
        }
      });
      
      rep.send({
        status_code     : 2000,
        mission_update  : missionFilter,
        bonus_str       : bonusFromMission['bonusStr'],
        turn            : bonusFromMission['dataUserUpdate']['turn'],
        bonus_sp_item   : bonusFromMission['bonusSPItem']
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  })

}

module.exports = missionRoute;