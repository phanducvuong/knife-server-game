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