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
      logger.emit('log', {
        action  : '[MISSION][JOIN-MISSION]',
        time    : new Date().toLocaleString(),
        detail  : 'join mission',
        data    : {
          id_mission  : idMission,
          user_id     : megaID,
          bonus       : bonusFromMission['bonusStr'],
          new_turn    : bonusFromMission['dataUserUpdate']['turn']
        }
      });
      
      rep.send({
        status_code     : 2000,
        mission_update  : missionFilter,
        bonus_str       : bonusFromMission['bonusStr'],
        turn            : bonusFromMission['dataUserUpdate']['turn']
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