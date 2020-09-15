exports.chkUserInBlackList = (megaID, blackList) => {
  for (e of blackList) {
    if (e === megaID) {
      return true;
    }
  }
  return false;
}

exports.convertStrItemToItem = (strItem) => {
  let split = strItem.split('_');
  return {
    id      : parseInt(split[0]),
    amount  : parseInt(split[1])
  }
}

exports.chkItemExistInInven = (inventory, idItem) => {
  for (let i=0; i<inventory.length; i++) {
    let itemConvert = this.convertStrItemToItem(inventory[i]);
    if (itemConvert['id'] === idItem) {
      return {
        item  : itemConvert,
        index : i
      };
    }
  }
  return null;
}