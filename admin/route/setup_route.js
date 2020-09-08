const FS                = require('../../repository/firestore');
const redisClient       = require('../../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

const setupRoute = async (app, opt) => {

  app.post('/partition', async (req, rep) => {

    try {

      const dataPartition = req.body.data;
      FS.FSUpdatePartition(dataPartition);
      redisClient.updatePartition(JSON.stringify(dataPartition));

      rep.send({
        status_code : 2000,
        result      : 'success'
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

module.exports = setupRoute;