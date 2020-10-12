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

exports.chkTimeEvent = (start, end) => {
  let time  = new Date();
  let timeS = new Date(start);
  let timeE = new Date(end);

  let convertMilli = time.getTime() + 7 * 3600 * 1000;
  if (convertMilli >= timeS.getTime() && convertMilli <= timeE.getTime()) {
    return true;
  }
  return false;
}