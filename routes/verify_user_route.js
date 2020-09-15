const verifyTokenFunc     = require('../functions/verify_user_func');
const redisClient         = require('../redis/redis_client');
const FS                  = require('../repository/firestore');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_pro');
}
else {
  config = require('../config_dev');
}

const dataInitUser = {
  inven: [],
  turn: 0,
  token:'',
  lucky_code: [],
  phone: '',
  userID: ''
}

const verifyUserRoute = async (app, opt) => {

  app.post('/verify-user', async (req, rep) => {
    
    try {

      const token   = req.body.token.toString().trim();
      const result  = await verifyTokenFunc.verifyTokenUser(token);

      if (result === null || result === undefined) {
        throw 'unvalid token';
      }

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(`${result.mega1_code}`));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await FS.FSGetTurnAndInven(`${result.mega1_code}`);
        if (dataUser === null || dataUser === undefined) {
          dataInitUser.token  = token;
          dataInitUser.phone  = result.phone;
          dataInitUser.userID = result.user_id;
          redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataInitUser));
          FS.FSInitDataUser(`${result.mega1_code}`, 'turn_inven', dataInitUser);
        }
        else {
          dataUser.token  = token;
          dataUser.phone  = result.phone;
          dataUser.userID = result.user_id;
          redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataUser));
          FS.FSUpdateTokenUser(`${result.mega1_code}`, token);
        }
      }
      else {
        dataUser.token  = token;
        dataUser.phone  = result.phone;
        dataUser.userID = result.user_id;
        redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataUser));
        FS.FSUpdateTokenUser(`${result.mega1_code}`, token);
      }

      rep.send({
        status_code : 2000,
        result      : result,
        turn        : dataUser['turn'],
        config      : config.PARTITIONS
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