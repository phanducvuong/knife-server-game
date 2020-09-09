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

  app.get('/get-partition', async (req, rep) => {

    try {

      let dataPartition = JSON.parse(await redisClient.getPartition());
      if (dataPartition === null || dataPartition === undefined) {

        dataPartition = await FS.FSGetPartition();
        if (dataPartition === null || dataPartition === undefined) {
          throw 'can not get partition';
        }

      }

      rep.view('/partials/error_view.ejs', {
        data  : dataPartition,
        title_error : 'can not get partition'
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }

  });

}

module.exports = setupRoute;