const DS            = require('../repository/datastore');
const redis         = require('../redis/redis_client');
const eventFunc     = require('../functions/event_func');
const util          = require('../utils/util');

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
        throw 'Event is comming soon!';
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

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();
      let idEvent   = parseInt(req.body.idEvent, 10);

      if (token   === null || token   === undefined || token  === '' ||
          megaID  === null || megaID  === undefined || megaID === '' ||
          isNaN(idEvent)) {
        throw `Pls check info user!`;
      }

      if (!util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        throw 'Event is comming soon!';
      }

      let dataUser = JSON.parse(await redis.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `User not exist with ${megaID}!`;
      }

      if (dataUser['token'] !== token) throw `Invalid token!`;

      let resultJoinEvent = eventFunc.joinEvent(dataUser, idEvent);
      if (resultJoinEvent['status'] === false) {
        rep.send({
          status_code : 2500,
          msg         : resultJoinEvent['msg']
        });
        return;
      }

      redis.updateTurnAndInvenUser(megaID, JSON.stringify(resultJoinEvent['dataUserUpdate']));
      DS.DSUpdateDataUser(megaID, 'turn_inven', resultJoinEvent['dataUserUpdate']);

      let lsFilter   = eventFunc.filterLsEventWithSpItem(resultJoinEvent['dataUserUpdate']['events']);
      rep.send({
        status_code   : 2000,
        bonus_str     : resultJoinEvent['bonusStr'],
        turn          : resultJoinEvent['dataUserUpdate']['turn'],
        ls_event      : lsFilter
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

module.exports = eventRoute;