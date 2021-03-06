const DS                    = require('../repository/datastore');
const redisClient           = require('../redis/redis_client');
const util                  = require('../utils/util');
const wheelFunc             = require('../functions/wheel_func');
const profileUserFunc       = require('../functions/profile_user_func');
const generateStr           = require('../utils/generate_string');
const logger                = require('fluent-logger');
const response              = require('../utils/response');
const topup                 = require('../repository/topup');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const wheelRoute = async (app, opt) => {

  app.post('/get-item', async (req, rep) => {

    try {

      const platform    = req.body.platform;
      const token       = req.body.token.toString().trim();
      const partition   = parseInt(req.body.partition, 10);
      const megaID      = req.body.megaID.toString().trim();
      const idItemRm    = req.body.idItemRm;

      if (!util.chkCountdown()) throw 'Game is Comming Soon!';

      //ending event
      if (util.endingEvent()) throw `Ending event!`;
      
      if (partition !== config.PARTITIONS['partition'] || config.PARTITIONS['data'].length !== config.PARTITIONS['partition']) {
        throw `please reload game to update config! ${megaID}`;
      }

      let time      = new Date();
      let dataUser  = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `user is not exist! ${megaID}`;
      } //get dataUser from redis. if user redis is not exist => get it from fs.

      if (dataUser['token'] !== token) {
        response.response(rep, 2800, `invalid token! ${megaID}`);
        return;
      }

      if (dataUser['turn'] <= 0) {
        response.response(rep, 2700, `turn is zero! ${megaID}`);
        return;
      };

      let item;
      let resultUpdateLsSpItem;
      if (util.chkUserExistInBlackList(megaID, config.BLACK_LIST)) {

        //TODO: Tách hàm check idItemRm từ đây và if else phía dưới
        if (idItemRm !== null && idItemRm !== undefined) {
          let tmpIdRm = parseInt(idItemRm, 10);
          if (isNaN(tmpIdRm)) throw `${idItemRm} remove box is not a number!`;

          let resultUpdateLsSpItem = profileUserFunc.descSpItemInLsSpItemById(dataUser['sp_item'], 0);
          if (resultUpdateLsSpItem['status'] === false) {
            response.response(rep, 2500, resultUpdateLsSpItem['msg']);
            return;
          }
          dataUser['sp_item'] = resultUpdateLsSpItem['lsSpItemUpdate'];
        }
        item = wheelFunc.getItemUnlimit();
      } //user is have in blacklist
      else if (idItemRm !== null && idItemRm !== undefined) {

        let tmpIdRm = parseInt(idItemRm, 10);
        if (isNaN(idItemRm)) throw `${idItemRm} remove box is not a number!`;

        resultUpdateLsSpItem = profileUserFunc.descSpItemInLsSpItemById(dataUser['sp_item'], 0);
        if (resultUpdateLsSpItem['status'] === false) {
          rep.send({
            status_code : 2500,
            msg         : resultUpdateLsSpItem['msg']
          });
          return;
        }
        dataUser['sp_item'] = resultUpdateLsSpItem['lsSpItemUpdate'];
        item = await wheelFunc.getItemWithRmBox(tmpIdRm, dataUser['total_turn_active_item']);

        // let countItemRm = wheelFunc.countIdItemRmInLsParition(tmpIdRm);
        // if (countItemRm === 1) {
        //   item = await wheelFunc.getItemWithRmBox(tmpIdRm, dataUser['total_turn_active_item']);
        // }
        // else {
        //   item = await wheelFunc.getRndItem(dataUser['total_turn_active_item']);
        // }
      } //remove item on box case
      else {
        item = await wheelFunc.getRndItem(dataUser['total_turn_active_item']);
      }

      if (item === null || item === undefined) throw `item is not exist! ${megaID}`;

      let strGenerate = '';
      if (item['type'] === 2) {
        strGenerate     = generateStr.getStringGenerate();
        if (await DS.DSIsExistLuckyCode('lucky_code_s1', strGenerate) === true) {
          response.response(rep, -1, 'Lucky code is exist in get item');
          return;
        }

        wheelFunc.incrAmountItemLuckycode(item);

        let str         = `${strGenerate}_${time.getTime()}`;
        dataUser['lucky_code'].push(str);
      } //generate string when user get item "Mã Cơ Hội"

      if (item['type'] === 0 || item['type'] === 1) {
        let notiStr = `${dataUser['name']}_${item['name']}_${time.getTime()}`;
        redisClient.addNotificaBanner(notiStr);
      } //lưu lại item là quà hoặc thẻ cào để chạy thông báo ở user

      if (util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        dataUser['events'][1] += 1;
      } //lưu lại lần phóng của user nếu sự kiện đang diễn ra

      let invenUpdate = profileUserFunc.updateInventory(dataUser['inven'], item);
      dataUser['turn']                    -= 1;
      dataUser['actions'][1]              += 1;
      dataUser['total_turned']            += 1;
      dataUser['total_turn_active_item']  += 1;
      dataUser['inven']                    = invenUpdate['invevntoryUpdate'];

      const strHis = JSON.stringify({
        time      : time.getTime(),
        id_item   : item['id'],
        amount    : invenUpdate['newAmount'],
        user_name : dataUser['name'],
        code      : strGenerate
      });
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      redisClient.updateHistoryUser(megaID, strHis);

      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      DS.DSUpdateHistoryUser(megaID, strHis);

      if (strGenerate !== '') {
        DS.DSInsertLuckyCode('lucky_code_s1', { code: strGenerate, time: time.getTime() });
      }

      let amountSpItem        = 0;
      let resultAmountSpItem  = profileUserFunc.getSpItemById(dataUser['sp_item'], 0);
      if (resultAmountSpItem['status']) amountSpItem = resultAmountSpItem['amount'];

      let region = config.PARTITIONS['data'].find(e => { return e['id'] === item['id'] });
      if (region === null || region === undefined) throw `Can not get region by ${item['id']}`;

      //topup tele card when item is tele
      let amountTeleCard = util.getAmountTeleCardByRegion(region['region']);
      if (!isNaN(amountTeleCard)) {
        topup.requestTopupCardPhone(amountTeleCard, dataUser['phone'], megaID);
      }

      //logger
      logger.emit('log', {
        action  : '[WHEEL][GET-ITEM]',
        time    : time.toLocaleString(),
        detail  : 'get item',
        data    : {
          user_id   : megaID,
          item      : item
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
        "os": platform,
        "platform": platform,
        "product": "",
        "sdk": "23",
        "sdk_version": "1.0.0",
        "server_timestamp": time.getTime(),
        "time_zone": "UTC",
        "timestamp": time.getTime()
      }

      logger.emit('log', {
        action  : '[KPI][GET-SDK]',
        time    : time.toLocaleString(),
        detail  : 'get SDK log',
        data    : {
          "app_id": app_id,
          "app_key": "21d7a592e0845117c8dba8e3bc94e869",
          "data": dataLog,
          "event_type": "4",
          "user_id": dataUser['userID']
        }
      });

      if (item['type'] >= 0) {
        logger.emit('log', {
          action  : '[KPI][GET-SDK]',
          time    : time.toLocaleString(),
          detail  : 'get SDK log',
          data    : {
            "app_id": app_id,
            "app_key": "21d7a592e0845117c8dba8e3bc94e869",
            "data": dataLog,
            "event_type": "7",
            "event_value": {
              "id": item['id']
            },
            "user_id": dataUser['userID']
          }
        });
      }

      rep.send({
        status_code     : 2000,
        turn            : dataUser['turn'],
        id              : item['id'],
        region          : region['region'],
        amount_sp_item  : amountSpItem
      });

    }
    catch(err) {

      logger.emit('log', {
        action  : '[WHEEL][GET-ITEM]',
        time    : new Date().toLocaleString(),
        detail  : 'error get item',
        data    : {
          error : err
        }
      });

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }

  });

}

module.exports = wheelRoute;