const FS            = require('../repository/firestore');
const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');

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

  app.post('/init-item', async (req, rep) => {

    const data = req.body.data;
    for (e of data) {
      FS.FSUpdateARRItemBy(e['id'], e);
    }

    rep.send('ok');

  });

  app.get('/get-all-item', async (req, rep) => {

    rep.send(config.ARR_ITEM);

  });

  app.get('/get-partitiion', async (req, rep) => {
    rep.send(config.PARTITIONS);
  });

  app.get('/get-config', async (req, rep) => {
    rep.send({
      total_percent : config.TOTAL_PERCENT,
      size          : config.ITEM_FILTER.length,
      item_filter   : config.ITEM_FILTER
    });
  });

  app.get('/get-supporting-item', async (req, rep) => {
    rep.send(config.SUPPORTING_ITEM);
  });

  app.post('/set-turn-user', async (req, rep) => {
    const megaID  = req.body.megaID;
    const turn    = req.body.turn;

    let dataUser      = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
    dataUser['turn']  = turn;

    FS.FSInitDataUser(megaID, 'turn_inven', dataUser);
    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

    rep.send('success');

  });

  app.get('/insert', async (req, rep) => {
    // DS.DSUpdateDataGlobal('items', '1', { id: 1, name: 'def' });
    let result = await DS.DSGetAllItem();
    rep.send(result);
  });

}

module.exports = globalRoute;