const crypto      = require('crypto');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

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
  let timeS = new Date(`${start} 00:00:00`);
  let timeE = new Date(`${end} 23:59:59`);

  // let convertMilli = time.getTime();
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

exports.convertTimeToString = (milli) => {
  let time    = new Date(milli + 7 * 3600 * 1000);
  let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
  let year    = time.getFullYear();
  let hour    = time.getHours() < 10 ? `0${time.getHours()}` : time.getHours();
  let minute  = time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes();
  // let second  = time.getSeconds();
  return `${month}-${date}-${year}  ${hour}:${minute}`;
}

exports.convertDateEventToString = (milli) => {
  let time    = new Date(milli + 7 * 3600 * 1000);
  let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
  let year    = time.getFullYear();
  // let second  = time.getSeconds();
  return `${year}-${month}-${date}`;
}

exports.isEligibleEventById0 = (fromDate, toDate) => {
  let tmpFromDate = new Date(fromDate);
  let tmpToDate   = new Date(toDate);
  let dateNow     = new Date();

  if (dateNow.getTime() >= tmpFromDate.getTime() && dateNow.getTime() <= tmpToDate.getTime()) {
    return true;
  }
  return false;
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

//secret key hash md5 code
/**
 * @key array enter code
 * code : mã code được hash
 * used : 0 -> chưa dùng, != 0 -> đã dùng
 */
let secretKeyHashCode = 'sajAdhasPhiLMbDcbzhBcsbj';
exports.isValidEntetCode = (code, lsEnterCode) => {
  let str1    = code + secretKeyHashCode;
  let hash1   = crypto.createHash('md5').update(str1).digest('hex');
  let result  = crypto.createHash('md5').update(hash1).digest('hex');
  
  for (let c of lsEnterCode) {
    if (result === c['code_hash'] && c['used'] === 0) {
      c['used'] = 1;
      return {
        status      : true,
        code        : c['code'],
        lsEnterCode : lsEnterCode
      };
    }
  }
  return { status: false };
}

//hash code from user entering
exports.genEnterCode = (code) => {
  let hash1   = crypto.createHash('md5').update(code).digest('hex');
  let result  = crypto.createHash('md5').update(hash1).digest('hex');
  return result;
}

exports.getAmountTeleCardByRegion = (region) => {
  switch(region) {
    case '10k'  : return 10000;
    case '20k'  : return 10000;
    case '50k'  : return 10000;
    case '100k' : return 10000;
    case '200k' : return 10000;
    case '500k' : return 10000;
    default     : return 'none';
  }
}

exports.chkCountdown = () => {
  let dateNow       = new Date();
  let dateCountDown = new Date(config.COUNT_DOWN);

  if ((dateNow.getTime() + 7 * 3600 * 1000) < dateCountDown.getTime()) {
    return false;
  }
  return true;
}

exports.formatTimeRuleBlockAccTo = (millisecond) => {
  let h = millisecond / 3600000;
  if (Number.isInteger(h)) return `${h}h`;

  h = millisecond / 60000;
  if (Number.isInteger(h)) return `${h}m`;
  
  return 'none';
}