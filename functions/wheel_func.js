const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.getRndItem = async (totalTurnActiveItem) => {
  if (config.ITEM_FILTER.length <= 0) return null;

  //new rule: nếu user xoay đủ số lượt thì mới active item
  let lsNewFilterItem = filterNewLsItemByTotalTurnActiveItem(config.ITEM_FILTER, totalTurnActiveItem);
  if (lsNewFilterItem['ls_filter_item'].length <= 0) return null;

  let rnd                   = Math.round(Math.random() * lsNewFilterItem['total_percent']) + 1;
  let percent               = 0;
  let isGetAmountItemRedis  = true;

  let tmpItem;
  for (item of lsNewFilterItem['ls_filter_item']) {
    percent += item.percent;
    if (rnd <= percent) {
      tmpItem = item;
      break;
    }
  }

  if (tmpItem === null || tmpItem === undefined) return null;
  if (tmpItem['maximum'] <= -1) return tmpItem;

  let amountItem = await redisClient.getAmountItem(tmpItem['id']);
  if (amountItem === null || amountItem === undefined || isNaN(amountItem)) {
    let itemDS = await DS.DSGetDataGlobal('items', tmpItem['id']);
    if (itemDS === null || itemDS === undefined) return null;
    amountItem            = itemDS['amount'];
    isGetAmountItemRedis  = false;
  }

  if (amountItem >= tmpItem['maximum']) {
    tmpItem = this.getItemUnlimit();
    if (tmpItem === null || tmpItem === undefined) return null;
    return tmpItem;
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
  return tmpItem;
}

exports.getItemWithRmBox = async (idItemRm, totalTurnActiveItem) => {
  if (config.ITEM_FILTER.length <= 0) return null;

  let result = newLsItemFilterWhenRmBox(idItemRm);
  if (result.length <= 0) return null;

  let lsNewFilterItem = filterNewLsItemByTotalTurnActiveItem(result, totalTurnActiveItem);
  if (lsNewFilterItem['ls_filter_item'].length <= 0) return null;

  let rnd                   = Math.round(Math.random() * lsNewFilterItem['total_percent']) + 1;
  let percent               = 0;
  let isGetAmountItemRedis  = true;

  let tmpItem;
  for (item of lsNewFilterItem['ls_filter_item']) {
    percent += item.percent;
    if (rnd <= percent) {
      tmpItem = item;
      break;
    }
  }

  if (tmpItem === null || tmpItem === undefined) return null;
  if (tmpItem['maximum'] <= -1) {
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
    tmpItem = this.getItemUnlimit();
    if (tmpItem === null || tmpItem === undefined) return null;
    return tmpItem;
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
  return tmpItem;
}

exports.getItemUnlimit = () => {
  let map = config.ITEM_FILTER.filter(e => e['maximum'] === -1);
  if (map.length <= 0 || map === null || map === undefined) return null;

  let rndIndex = Math.round(Math.random() * (map.length-1));
  return map[rndIndex];
}

exports.incrAmountItemLuckycode = async (item) => {
  let itemDS = await DS.DSGetDataGlobal('items', item['id']);
  if (itemDS !== null && itemDS !== undefined) {
    itemDS['amount'] += 1;
    redisClient.updateAmountItemBy(itemDS['id'], itemDS['amount']);
    DS.DSUpdateDataGlobal('items', itemDS['id'], itemDS);
  }
}

//đếm số lượng item remove trong partition. nếu idItem trong partition xuất hiện 2 lần thì getItem normal, không thì getItem dạng removeItem
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
  if (countIdItemInLsItem(config.PARTITIONS['data'], idItemRm) !== 1)
    return config.ITEM_FILTER;

  let newLsFilter = [];
  newLsFilter.push(...config.ITEM_FILTER);

  for (let i=0; i<newLsFilter.length; i++) {
    if (newLsFilter[i]['id'] === idItemRm) {
      newLsFilter.splice(i, 1);
      break;
    }
  }

  return newLsFilter;
}

function filterNewLsItemByTotalTurnActiveItem(lsItem, totalTurnActiveItem) {
  let lsFilterItem  = [];
  let totalPercent  = 0;

  for (let item of lsItem) {
    if (totalTurnActiveItem >= item['active']) {
      lsFilterItem.push(item);
      totalPercent += item['percent'];
    }
  }
  return {
    ls_filter_item  : lsFilterItem,
    total_percent   : totalPercent
  };
}

function countIdItemInLsItem(lsItem, idItem) {
  let count = 0;
  for (let item of lsItem) {
    if (item['id'] === idItem)
      count++;
  }
  return count;
}