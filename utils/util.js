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

exports.chkUserExistInBlackList = (mega_code, lsBlackList) => {
  for (let b of lsBlackList) {
    if (b['mega_code'] === mega_code && b['status'] === 1) {
      return true;
    }
  }
  return false;
}

exports.convertTimeToString = (mili) => {
  let time  = new Date(mili);
  let month = time.getMonth() + 1;
  let date  = time.getDate();
  let year  = time.getFullYear();
  return `${date}/${month}/${year}`;
}

exports.chkTheSameDate = (milli1, milli2) => {
  let d1 = new Date(milli1);
  let d2 = new Date(milli2);

  if (d1.getDate()      === d2.getDate()  &&
      d1.getMonth()     === d2.getMonth() &&
      d1.getFullYear()  === d2.getFullYear()) {
    return true;
  }
  return false;
}

exports.isValidDate = (date) => {
  let d = new Date(date);
  if (isNaN(d.getTime())) {
    return false;
  }
  return true;
}