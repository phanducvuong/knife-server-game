const DS            = require('../repository/datastore');
const redis         = require('../redis/redis_client');
const eventFunc     = require('../functions/event_func');
const util          = require('../utils/util');
const logger        = require('fluent-logger');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const eventRoute = async (app, opt) => {

  app.post('/get-all-event', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '') {
        throw `Pls check info user!`;
      }

      if (!util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        rep.send({
          status_code : 2500,
          msg         : 'Event is comming soon!'
        });
        return;
      }

      let dataUser = JSON.parse(await redis.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist with ${megaID}!`;
      }

      if (dataUser['token'] !== token) throw `Invalid token!`;

      let lsFilter   = eventFunc.filterLsEventWithSpItem(dataUser['events']);
      rep.send({
        status_code : 2000,
        ls_event    : lsFilter,
        time_start  : config.EVENTS.start,
        time_end    : config.EVENTS.end,
        turn        : dataUser['turn'],
        turned      : dataUser['total_turned'],
        name        : dataUser['name']
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

  app.post('/join-event', async (req, rep) => {
    try {

      let platform  = req.body.platform;
      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();
      let idEvent   = parseInt(req.body.idEvent, 10);

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '' ||
          isNaN(idEvent)) {
        throw `Pls check info user! ${megaID} ${idEvent}`;
      }

      if (!util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        throw 'Event is comming soon!';
      }

      let date      = new Date();
      let dataUser  = JSON.parse(await redis.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist with ${megaID}!`;
      }

      if (dataUser['token'] !== token) throw `Invalid token!`;

      let resultJoinEvent = eventFunc.joinEvent(dataUser, idEvent);
      if (resultJoinEvent['status'] === false) {

        //logger
        logger.emit('log', {
          action  : '[EVENT][JOIN-EVENT]',
          time    : date.toLocaleString(),
          detail  : resultJoinEvent['msg'],
          data    : {
            user_id   : megaID,
            id_event  : idEvent
          }
        });

        rep.send({
          status_code : 2500,
          msg         : resultJoinEvent['msg']
        });
        return;
      }

      redis.updateTurnAndInvenUser(megaID, JSON.stringify(resultJoinEvent['dataUserUpdate']));
      DS.DSUpdateDataUser(megaID, 'turn_inven', resultJoinEvent['dataUserUpdate']);

      //logger
      logger.emit('log', {
        action  : '[EVENT][JOIN-EVENT]',
        time    : date.toLocaleString(),
        detail  : 'join event',
        data    : {
          id_event  : idEvent,
          user_id   : megaID,
          bonus     : resultJoinEvent['bonusStr'],
          new_turn  : resultJoinEvent['dataUserUpdate']['turn']
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
            "id": idEvent
          },
          "user_id": dataUser['userID']
        }
      });

      let lsFilter   = eventFunc.filterLsEventWithSpItem(resultJoinEvent['dataUserUpdate']['events']);
      rep.send({
        status_code   : 2000,
        bonus_str     : resultJoinEvent['bonusStr'],
        turn          : resultJoinEvent['dataUserUpdate']['turn'],
        ls_event      : lsFilter
      });

    }
    catch(err) {

      //logger
      logger.emit('log', {
        action  : '[EVENT][JOIN-EVENT]',
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

}

module.exports = eventRoute;