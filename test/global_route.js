const FS            = require('../repository/firestore');
const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');
const strGenerate   = require('../utils/generate_string');
const profileFunc   = require('../functions/profile_user_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const globalRoute = async (app, opt) => {

  app.get('/microsecond', async (req, rep) => {
    const hrtime1      = process.hrtime();
    const hrtime2      = process.hrtime();
    let micro = strGenerate.getStringGenerate(hrtime1);
    let micro1 = strGenerate.getStringGenerate(hrtime2);
    rep.send({
      m1 : micro,
      m2  : micro1
    });
  });

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

  app.get('/get-filter-item', async (req, rep) => {
    rep.send(config.ITEM_FILTER);
  });

  app.get('/get-partitiion', async (req, rep) => {
    rep.send(config.PARTITIONS);
  });

  app.get('/get-mission', async (req, rep) => {
    rep.send(config.MISSIONS);
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

    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

    rep.send('success');

  });

  app.get('/insert', async (req, rep) => {
    let result = await DS.DSGetDataGlobal('admin', 'supporting_item');
    rep.send(result);
  });

  app.post('/empty-mission', async (req, rep) => {
    let megaID          = req.body.megaID;
    let dataUser        = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
    dataUser['mission'] = [];

    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

    rep.send('ok');
  });

  app.post('/update-sp-item', async (req, rep) => {
    let megaID    = req.body.megaID;
    let idSpItem  = req.body.idSpItem;
    let amount    = req.body.amount;
    let dataUser  = await DS.DSGetDataUser(megaID, 'turn_inven');

    for (let i=0; i<dataUser['sp_item'].length; i++) {
      let tmpStr = dataUser['sp_item'][i].split('_');
      if (tmpStr[0] === idSpItem) {
        tmpStr[1] = amount;
        dataUser['sp_item'][i] = `${tmpStr[0]}_${tmpStr[1]}`;
        break;
      }
    }

    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

    rep.send('ok');
  });

  app.get('/notifica-banner', async (req, rep) => {
    let data = await profileFunc.getNotificaBanner();
    rep.send(data);
  });

}

module.exports = globalRoute;