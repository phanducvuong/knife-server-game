const FS                    = require('../repository/firestore');
const redisClient           = require('../redis/redis_client');
const util                  = require('../utils/util');
const wheelFunc             = require('../functions/wheel_func');
const profileUserFunc       = require('../functions/profile_user_func');

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

      const token     = req.body.token.toString().trim();
      const partition = parseInt(req.body.partition, 10);
      const megaID    = req.body.megaID.toString().trim();

      let [strPartition, strDataUser] = await Promise.all([
        redisClient.getPartition(),
        redisClient.getTurnAndInvenUser(megaID)
      ]);

      let lsPartition;
      if (strPartition !== null && strPartition !== undefined) {
        lsPartition = JSON.parse(strPartition);
      }
      else {
        lsPartition = await FS.FSGetPartition();
        if (lsPartition === null || lsPartition === undefined) throw 'please setup data!';
      }

      if (partition !== lsPartition['partition']) throw `please reload game to update config!`;

      let dataUser = JSON.parse(strDataUser);
      if (dataUser === null || dataUser === undefined) {
        dataUser = await FS.FSGetTurnAndInven(megaID);
        if (dataUser === null || dataUser === undefined) throw `user is not exist`;
      } //get dataUser from redis. if user redis is not exist => get it from fs.

      if (dataUser['token'] !== token || dataUser['turn'] <= 0) throw 'unvalid token or turn is zero';

      let item;
      if (util.chkUserInBlackList(megaID, config.BLACK_LIST) === true) {
        item = wheelFunc.getItemUnlimit();
      } //user is have in blacklist
      else {
        item = await wheelFunc.getRndItem(lsPartition['total_percent']);
      }

      if (item === null || item === undefined) throw 'item is not exist';

      //TODO: update data user and incr amount item
      dataUser['turn'] -= 1;
      dataUser['inven'] = profileUserFunc.updateInventory(dataUser['inven'], item);

      //TODO: nếu user xoay trúng được mã cơ hội => gen mã lưu lại trong lucky_code

      const strHis = JSON.stringify({
        time    : new Date().getTime(),
        id_item : item['id']
      });
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      redisClient.updateHistoryUser(megaID, strHis);

      FS.FSInitDataUser(megaID, 'turn_inven', dataUser);
      FS.FSUpdateHistoryUser(megaID, strHis);

      rep.send({
        status_code : 2000,
        turn        : dataUser['turn'],
        id          : item['id']
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