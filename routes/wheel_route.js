const DS                    = require('../repository/datastore');
const redisClient           = require('../redis/redis_client');
const util                  = require('../utils/util');
const wheelFunc             = require('../functions/wheel_func');
const profileUserFunc       = require('../functions/profile_user_func');
const generateStr           = require('../utils/generate_string');

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

      const token       = req.body.token.toString().trim();
      const partition   = parseInt(req.body.partition, 10);
      const megaID      = req.body.megaID.toString().trim();
      const idItemRm    = req.body.idItemRm;

      if (partition !== config.PARTITIONS['partition'] || config.PARTITIONS['data'].length !== config.PARTITIONS['partition']) {
        throw `please reload game to update config!`;
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `user is not exist`;
      } //get dataUser from redis. if user redis is not exist => get it from fs.

      if (dataUser['token'] !== token || dataUser['turn'] <= 0) throw 'unvalid token or turn is zero';

      let item;
      if (config.BLACK_LIST.includes(megaID)) {

        //TODO: Tách hàm check idItemRm từ đây và if else phía dưới
        if (idItemRm !== null && idItemRm !== undefined) {
          let tmpIdRm = parseInt(idItemRm, 10);
          if (isNaN(idItemRm)) throw `${idItemRm} remove box is not a number!`;

          let resultUpdateLsSpItem = profileUserFunc.descSpItemInLsSpItemById(dataUser['sp_item'], tmpIdRm);
          if (resultUpdateLsSpItem['status'] === false) {
            rep.send({
              status_code : 2500,
              msg         : resultUpdateLsSpItem['msg']
            });
            return;
          }
          dataUser['sp_item'] = resultUpdateLsSpItem['lsSpItemUpdate'];
        }
        item                = wheelFunc.getItemUnlimit();

      } //user is have in blacklist
      else if (idItemRm !== null && idItemRm !== undefined) {

        let tmpIdRm = parseInt(idItemRm, 10);
        if (isNaN(idItemRm)) throw `${idItemRm} remove box is not a number!`;

        let resultUpdateLsSpItem = profileUserFunc.descSpItemInLsSpItemById(dataUser['sp_item'], tmpIdRm);
        if (resultUpdateLsSpItem['status'] === false) {
          rep.send({
            status_code : 2500,
            msg         : resultUpdateLsSpItem['msg']
          });
          return;
        }
        dataUser['sp_item'] = resultUpdateLsSpItem['lsSpItemUpdate'];

        let countItemRm = wheelFunc.countIdItemRmInLsParition(tmpIdRm);
        if (countItemRm === 1) {
          item = await wheelFunc.getItemWithRmBox(tmpIdRm);
        }
        else {
          item = await wheelFunc.getRndItem();
        }
      } //remove item on box case
      else {
        item = await wheelFunc.getRndItem();
      }

      if (item === null || item === undefined) throw 'item is not exist';

      if (item['type'] === 2) {
        let strGenerate = generateStr.getStringGenerate();
        dataUser['lucky_code'].push(strGenerate);
      } //generate string when user get item "Mã Cơ Hội"

      if (item['type'] === 0 || item['type'] === 1) {
        let time    = new Date();
        let notiStr = `${dataUser['name']}_${item['name']}_${time.getTime()}`;
        redisClient.addNotificaBanner(notiStr);
      } //lưu lại item là quà hoặc thẻ cào để chạy thông báo ở user

      if (util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        dataUser['events'][1] += 1;
      } //lưu lại lần phóng của user nếu sự kiện đang diễn ra

      dataUser['turn']          -= 1;
      dataUser['actions'][1]    += 1;
      dataUser['total_turned']  += 1;
      dataUser['inven']          = profileUserFunc.updateInventory(dataUser['inven'], item);

      const strHis = JSON.stringify({
        time    : new Date().getTime(),
        id_item : item['id']
      });
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      redisClient.updateHistoryUser(megaID, strHis);

      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      DS.DSUpdateHistoryUser(megaID, strHis);

      let region = config.PARTITIONS['data'].find(e => { return e['id'] === item['id'] });
      if (region === null || region === undefined) throw `Can not get region by ${item['id']}`;

      rep.send({
        status_code : 2000,
        turn        : dataUser['turn'],
        id          : item['id'],
        region      : region['region']
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

module.exports = wheelRoute;