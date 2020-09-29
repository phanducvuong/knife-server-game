const FS            = require('../repository/firestore');
const redisClient   = require('../redis/redis_client');
const util          = require('../utils/util');

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