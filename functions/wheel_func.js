const FS            = require('../repository/firestore');
const redisClient   = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.getRndItem = async (totalPercent) => {
  let rnd     = Math.round(Math.random() * totalPercent) + 1;
  let percent = 0;

  let tmpItem = config.ARR_ITEM.find(e => { return e.maximum <= 0 });
  for (let item of config.ARR_ITEM) {
    percent += item.percent;
    if (rnd <= percent) {
      tmpItem = item;
      break;
    }
  }

  let amountItem = await redisClient.getAmountItem(tmpItem['id']);
  if (amountItem === null || amountItem === undefined) {
    let itemFS = await FS.FSGetItemBy(tmpItem['id']);
    if (itemFS === null || itemFS === undefined) return null;
    amountItem = itemFS['amount'];
  }

  if (amountItem >= tmpItem['maximum'] && tmpItem['maximum'] > 0) {
    tmpItem = config.ARR_ITEM.find(e => { return e['id'] === 3 });
  }

  return tmpItem;
}

exports.getItemUnlimit = () => {
  return config.ARR_ITEM.find(e => { return e['id'] === 3 });
}