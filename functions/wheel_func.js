const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.getRndItem = async () => {
  if (config.ITEM_FILTER.length <= 0) return null;

  let rnd                   = Math.round(Math.random() * config.TOTAL_PERCENT) + 1;
  let percent               = 0;
  let isGetAmountItemRedis  = true;

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
    // DS.DSIncreaseAmountItem(tmpItem['id']);
    return tmpItem;
  }

  let amountItem = await redisClient.getAmountItem(tmpItem['id']);
  if (amountItem === null || amountItem === undefined || isNaN(amountItem)) {
    let itemDS = await DS.DSGetDataGlobal('items', tmpItem['id']);
    if (itemDS === null || itemDS === undefined) return null;
    amountItem            = itemDS['amount'];
    isGetAmountItemRedis  = false;
  }

  if (amountItem >= tmpItem['maximum']) {
    tmpItem = config.ITEM_FILTER.find(e => { return e['maximum'] <= -1 });
  }

  console.log(tmpItem);

  amountItem        += 1;
  tmpItem['amount']  = amountItem;

  if (!isGetAmountItemRedis) {
    redisClient.incrByItemBy(tmpItem['id'], amountItem);
  }
  else {
    redisClient.incrItemBy(tmpItem['id']);
  }
  DS.DSUpdateDataGlobal('items', tmpItem['id'], tmpItem);
  // DS.DSIncreaseAmountItem(tmpItem['id']);
  return tmpItem;
}

exports.getItemWithRmBox = async (idItemRm) => {
  if (config.ITEM_FILTER.length <= 0) return null;

  let result = newLsItemFilterWhenRmBox(idItemRm);
  if (result['newLsFilter'].length <= 0) return null;

  let rnd                   = Math.round(Math.random() * result['totalPercent']) + 1;
  let percent               = 0;
  let isGetAmountItemRedis  = true;

  // let tmpItem = config.ITEM_FILTER.find(e => { return e.maximum <= 0 });
  let tmpItem;
  for (item of result['newLsFilter']) {
    percent += item.percent;
    if (rnd <= percent) {
      tmpItem = item;
      break;
    }
  }

  if (tmpItem === null || tmpItem === undefined) return null;
  if (tmpItem['maximum'] <= -1) {
    // DS.DSIncreaseAmountItem(tmpItem['id']);
    return tmpItem;
  }

  let amountItem = await redisClient.getAmountItem(tmpItem['id']);
  if (amountItem === null || amountItem === undefined || isNaN(amountItem)) {
    let itemDS = await DS.DSGetDataGlobal('items', tmpItem['id']);
    if (itemDS === null || itemDS === undefined) return null;
    amountItem            = itemDS['amount'];
    isGetAmountItemRedis  = false;
  }

  if (amountItem >= tmpItem['maximum']) {
    tmpItem = config.ITEM_FILTER.find(e => { return e['maximum'] <= -1 });
  }

  amountItem        += 1;
  tmpItem['amount']  = amountItem;

  if (!isGetAmountItemRedis) {
    redisClient.incrByItemBy(tmpItem['id'], amountItem);
  }
  else {
    redisClient.incrItemBy(tmpItem['id']);
  }
  DS.DSUpdateDataGlobal('items', tmpItem['id'], tmpItem);
  // DS.DSIncreaseAmountItem(tmpItem['id']);
  return tmpItem;
}

exports.getItemUnlimit = () => {
  let map = config.ARR_ITEM.filter(e => e['maximum'] === -1);
  if (map.length <= 0) return null;

  let rndIndex = Math.round(Math.random() * (map.length-1));
  return map[rndIndex];
}

exports.countIdItemRmInLsParition = (idItemRm) => {
  let count = 0;
  for (let e of config.ITEM_FILTER) {
    if (e['id'] === idItemRm) {
      count++;
    }
  }
  return count;
}

//-------------------------------------------------functional------------------------------------------
function newLsItemFilterWhenRmBox(idItemRm) {
  let newLsFilter = [];
  newLsFilter.push(...config.ITEM_FILTER);

  for (let i=0; i<newLsFilter.length; i++) {
    if (newLsFilter[i]['id'] === idItemRm) {
      newLsFilter.splice(i, 1);
      break;
    }
  }

  let totalPercent = 0;
  for (let e of newLsFilter) {
    totalPercent += e['percent'];
  }

  return {
    newLsFilter   : newLsFilter,
    totalPercent  : totalPercent
  }
}