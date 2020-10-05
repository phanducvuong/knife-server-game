const redisClient   = require('../redis/redis_client');
const util          = require('../utils/util');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.updateInventory = (inventory, item) => {
  if (item['save'] === true) {
    let itemExist = util.chkItemExistInInven(inventory, item['id']);
    if (itemExist !== null) {
      itemExist['item']['amount']   += 1;

      let strItem                    = `${itemExist['item']['id']}_${itemExist['item']['amount']}`;
      inventory[itemExist['index']]  = strItem;
      return inventory;
    }

    let strItem = `${item['id']}_1`;
    inventory.push(strItem);
    return inventory;
  }
  return inventory;
}

exports.updateLsLuckyCode = (lsLuckyCode) => {

}

exports.updateLsSpItemUser = (lsSpItem, idSpItem) => {
  for (let i=0; i<lsSpItem.length; i++) {
    let tmpStr  = lsSpItem[i].split('_');
    let id      = parseInt(tmpStr[0], 10);
    let amount  = parseInt(tmpStr[1], 10);

    if (isNaN(id) || isNaN(amount) || amount <= 0) {
      return {
        status  : false,
        msg     : 'Can not get sp item in list user or amount = 0!'
      }
    }

    if (id === idSpItem) {
      amount      -= 1;
      lsSpItem[i]  = `${id}_${amount}`;
      break;
    }
  }

  return {
    status          : true,
    lsSpItemUpdate  : lsSpItem
  }
}

exports.filterHistory = (lsInventory) => {
  let lsGift  = [];
  let lsCard  = [];

  for (let e of lsInventory) {
    let tmp     = e.split('_');
    let id      = parseInt(tmp[0], 10);
    let amount  = parseInt(tmp[1], 10);

    if (!isNaN(id) && !isNaN(amount)) {
      let tmpItem = config.ARR_ITEM.find(e => { return e['id'] === id });
      if (tmpItem !== null && tmpItem !== undefined) {

        let tmpP    = config.PARTITIONS.data.find(ee => { return ee['id'] === tmpItem['id']});
        if (tmpP === null || tmpP === undefined) {
          return {
            lsGift  : lsGift,
            lsCard  : lsCard
          };
        }
        switch(tmpItem['type']) {
          case 0: {
            lsGift.push({
              id          : id,
              description : tmpItem['name'],
              amount      : amount,
              region      : tmpP['region']
            });
            break;
          }
          case 1: {
            lsCard.push({
              id          : id,
              description : tmpItem['name'],
              amount      : amount,
              region      : tmpP['region']
            });
            break;
          }
        }
        
      }
    }
  }

  return {
    lsGift  : lsGift,
    lsCard  : lsCard
  }
}

exports.getNotificaBanner = async () => {
  let arrNoti = [];
  let time    = new Date();

  let data    = await redisClient.getNotificaBanner();
  for (let e of data) {
    let tmp     = e.split('_');
    let tmpTime = parseInt(tmp['2']);
    if (time.getTime() - tmpTime < 1500000) {
      arrNoti.push(`Chúc Mừng ${tmp[0]} đã trúng được ${tmp[1]}`);
    }
  }
  return arrNoti;
}