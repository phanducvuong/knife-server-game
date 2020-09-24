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

exports.getRndItem = async (totalPercent) => {
  if (config.ITEM_FILTER.length <= 0) return null;

  let rnd     = Math.round(Math.random() * config.TOTAL_PERCENT) + 1;
  let percent = 0;

  // let tmpItem = config.ITEM_FILTER.find(e => { return e.maximum <= 0 });
  let tmpItem;
  for (item of config.ITEM_FILTER) {
    percent += item.percent;
    if (rnd <= percent) {
      tmpItem = item;
      break;
    }
  }

  if (tmpItem === null || tmpItem === undefined) return null;
  if (tmpItem['maximum'] <= -1) {
    DS.DSIncreaseAmountItem(tmpItem['id']);
    return tmpItem;
  }

  let amountItem = await redisClient.getAmountItem(tmpItem['id']);
  if (amountItem === null || amountItem === undefined) {
    let itemDS = await DS.DSGetDataGlobal('items', tmpItem['id']);
    if (itemDS === null || itemFS === undefined) return null;
    amountItem = itemDS['amount'];
  }

  if (amountItem >= tmpItem['maximum']) {
    tmpItem = config.ARR_ITEM.find(e => { return e['maximum'] === -1 });
  }

  redisClient.incrItemBy(tmpItem['id']);
  DS.DSIncreaseAmountItem(tmpItem['id']);
  return tmpItem;
}

exports.getItemUnlimit = () => {
  return config.ARR_ITEM.find(e => { return e['maximum'] === -1 });
}