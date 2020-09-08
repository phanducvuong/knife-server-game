var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const globalRoute = async (app, opt) => {

  app.get('/partition', async (req, rep) => {
    rep.send(config.PARTITIONS);
  });

}

module.exports = globalRoute;