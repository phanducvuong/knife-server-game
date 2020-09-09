const configFunc      = require('../functions/config_func');
const redisClient     = require('../redis/redis_client');
const FS              = require('../repository/firestore');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const configRoute = async (app, opt) => {

  app.post('/get-partition', async (req, rep) => {

    try {

      const megaID      = req.body.megaID.toString().trim();
      const token       = req.body.token.toString().trim();

      if (config.PARTITIONS.data.length <= 0) throw 'get config failed!';

      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
      if (dataUser === null || dataUser === undefined) {

        dataUser = await FS.FSGetTurnAndInven(megaID);
        if (dataUser === null || dataUser === undefined) throw 'get data user failed!';

      }

      if (dataUser['token'] !== token) throw 'unvalid token';
      

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

module.exports = configRoute;