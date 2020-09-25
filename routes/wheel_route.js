const FS                    = require('../repository/firestore');
const DS                    = require('../repository/datastore');
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

      const token       = req.body.token.toString().trim();
      const partition   = parseInt(req.body.partition, 10);
      const megaID      = req.body.megaID.toString().trim();

      if (partition !== config.PARTITIONS['partition']) throw `please reload game to update config!`;

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
        if (dataUser === null || dataUser === undefined) throw `user is not exist`;
      } //get dataUser from redis. if user redis is not exist => get it from fs.

      console.log(`token: ${token}`);
      if (dataUser['token'] !== token || dataUser['turn'] <= 0) throw 'unvalid token or turn is zero';

      let item;
      if (util.chkUserInBlackList(megaID, config.BLACK_LIST) === true) {
        item = wheelFunc.getItemUnlimit();
      } //user is have in blacklist
      else {
        item = await wheelFunc.getRndItem(config.PARTITIONS['total_percent']);
      }

      if (item === null || item === undefined) throw 'item is not exist';

      //TODO: update data user and incr amount item
      dataUser['turn']          -= 1;
      dataUser['total_turned']  += 1;
      dataUser['inven']          = profileUserFunc.updateInventory(dataUser['inven'], item);

      //TODO: nếu user xoay trúng được mã cơ hội => gen mã lưu lại trong lucky_code

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

      console.log(dataUser);

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