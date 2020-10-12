const verifyTokenFunc     = require('../functions/verify_user_func');
const redisClient         = require('../redis/redis_client');
const DS                  = require('../repository/datastore');
const profileFunc         = require('../functions/profile_user_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

/**
 * @key actions (lưu lại hoạt động của user để checking mission. return actions to 0 when 23:59:59)
 * index at 0 -> nhập code
 * index at 1 -> phóng phi tiêu
 * 
 * @key events (giống actions. Cứ mỗi lần user nhận bonus thì trừ số lượng event tương ứng)
 * index at 0 -> nhập code
 * index at 1 -> phóng phi tiêu
 * index at 2 -> mời bạn
 */

const dataInitUser = {
  inven         : [],
  turn          : 0,
  total_turned  : 0,
  token         :'',
  actions       : [0, 0],
  events        : [0, 0, 0],
  lucky_code    : [],
  sp_item       : [],
  mission       : [],
  phone         : '',
  userID        : '',
  name          : ''
}

const verifyUserRoute = async (app, opt) => {

  app.post('/verify-user', async (req, rep) => {
    
    try {

      const token   = req.body.token.toString().trim();
      const result  = await verifyTokenFunc.verifyTokenUser(token);

      if (result === null || result === undefined || token === null || token === undefined) {
        throw 'unvalid token';
      }

      if (config.PARTITIONS['data'].length !== config.PARTITIONS['partition']) {
        throw `please reload game to update config!`;
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(`${result.mega1_code}`));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(`${result.mega1_code}`, 'turn_inven');
        if (dataUser === null || dataUser === undefined) {
          dataInitUser.token  = token;
          dataInitUser.phone  = result.phone;
          dataInitUser.userID = result.user_id;
          dataInitUser.name   = result.name;
          redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataInitUser));
          DS.DSUpdateDataUser(`${result.mega1_code}`, 'turn_inven', dataInitUser);

          dataUser = dataInitUser;
        }
        else {
          dataUser.token  = token;
          dataUser.phone  = result.phone;
          dataUser.userID = result.user_id;
          dataUser.name   = result.name;
          redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataUser));
          DS.DSUpdateDataUser(`${result.mega1_code}`, 'turn_inven', dataUser);
        }
      }
      else {
        dataUser.token  = token;
        dataUser.name   = result.name;
        redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataUser));
        DS.DSUpdateDataUser(`${result.mega1_code}`, 'turn_inven', dataUser);
      }

      let arrNotifica         = await profileFunc.getNotificaBanner();

      let amountSpItem        = 0;
      let resultAmountSpItem  = profileFunc.getSpItemById(dataUser['sp_item'], 0);
      if (resultAmountSpItem['status']) amountSpItem = resultAmountSpItem['amount'];

      rep.send({
        status_code     : 2000,
        result          : result,
        turn            : dataUser['turn'],
        amount_sp_item  : amountSpItem,
        config          : config.PARTITIONS,
        noti_banner     : arrNotifica
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

module.exports = verifyUserRoute;