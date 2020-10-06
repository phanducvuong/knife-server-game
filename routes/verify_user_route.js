const verifyTokenFunc     = require('../functions/verify_user_func');
const redisClient         = require('../redis/redis_client');
const DS                  = require('../repository/datastore');
const profileFunc         = require('../functions/profile_user_func');

/**
 * actions (lưu lại hoạt động của user để checking mission)
 * index at 0 -> nhập code
 * index at 1 -> phóng phi tiêu
 */

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const dataInitUser = {
  inven: [],
  turn: 0,
  total_turned: 0,
  token:'',
  actions: [],
  lucky_code: [],
  sp_item: [],
  mission: [],
  phone: '',
  userID: '',
  name: ''
}

const verifyUserRoute = async (app, opt) => {

  app.post('/verify-user', async (req, rep) => {
    
    try {

      const token   = req.body.token.toString().trim();
      const result  = await verifyTokenFunc.verifyTokenUser(token);

      if (result === null || result === undefined || token === null || token === undefined) {
        throw 'unvalid token';
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

      let arrNotifica = await profileFunc.getNotificaBanner();
      rep.send({
        status_code : 2000,
        result      : result,
        turn        : dataUser['turn'],
        config      : config.PARTITIONS,
        noti_banner : arrNotifica
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