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
      return {
        invevntoryUpdate  : inventory,
        newAmount         : itemExist['item']['amount']
      };
    }

    let strItem = `${item['id']}_1`;
    inventory.push(strItem);
    return {
      invevntoryUpdate  : inventory,
      newAmount         : 1
    };;
  }
  return {
    invevntoryUpdate  : inventory,
    newAmount         : -1
  };;
}

exports.descSpItemInLsSpItemById = (lsSpItem, idSpItem) => {
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
      return { status: true, lsSpItemUpdate: lsSpItem, amount: amount }
    }
  }

  return {
    status  : false,
    msg     : `${idSpItem} is not exist!`
  }
}

exports.incrSpItemInLsSpItemById = (lsSpItem, idSpItem, unit) => {
  for (let i=0; i<lsSpItem.length; i++) {
    let tmpStr  = lsSpItem[i].split('_');
    let id      = parseInt(tmpStr[0], 10);
    let amount  = parseInt(tmpStr[1], 10);
    
    if (isNaN(id) || isNaN(amount)) {
      return { status: false, msg: 'Invalid sp item when get it in list!' }
    }

    if (id === idSpItem) {
      amount      += unit;
      lsSpItem[i]  = `${id}_${amount}`;
      return { status: true, data: lsSpItem }
    }
  }

  lsSpItem.push(`${idSpItem}_${unit}`);
  return {
    status  : true,
    data    : lsSpItem
  }
}

exports.getBonusFromMissionOrEvent = (obj, dataUser) => {
  if (obj['bonus_turn'] > 0 && obj['bonus_sp_item'] > 0) {
    let str         = `${obj['bonus_turn']} lượt và ${obj['bonus_sp_item']} ${obj['sp_item']['description']}`;
    let resultBonus = this.incrSpItemInLsSpItemById(dataUser['sp_item'], obj['sp_item']['id'], obj['bonus_sp_item']);

    if (!resultBonus['status']) return { status: false, msg: resultBonus['msg'] };
    return {
      status          : true,
      bonus_str       : str,
      bonus_turn      : obj['bonus_turn'],
      bonus_sp_item   : obj['bonus_sp_item'],
      lsSpItemUpdate  : resultBonus['data']
    }
  }
  else if (obj['bonus_turn'] === 0 && obj['bonus_sp_item'] > 0) {
    let str         = `${obj['bonus_sp_item']} ${obj['sp_item']['description']}`;
    let resultBonus = this.incrSpItemInLsSpItemById(dataUser['sp_item'], obj['sp_item']['id'], obj['bonus_sp_item']);

    if (!resultBonus['status']) return { status: false, msg: resultBonus['msg'] };
    return {
      status          : true,
      bonus_str       : str,
      bonus_turn      : 0,
      bonus_sp_item   : obj['bonus_sp_item'],
      lsSpItemUpdate  : resultBonus['data']
    }
  }
  else {
    str = `${obj['bonus_turn']} lượt`;
    return {
      status          : true,
      bonus_str       : str,
      bonus_turn      : obj['bonus_turn'],
      bonus_sp_item   : 0,
      lsSpItemUpdate  : dataUser['sp_item']
    }
  }
}

exports.getBonusFromEventX2 = (obj, dataUser) => {
  if (!util.isEligibleEventById0(config.EVENTS['data'][0]['from_date'], config.EVENTS['data'][0]['to_date']) ||
      dataUser['xX_bonus_turn'].length <= 0) {
    return { status: false, msg: 'event by id 0 is failed!' };
  }

  let bonusTurn  = obj['mul'] * dataUser['xX_bonus_turn'][0];
  let str         = `${bonusTurn} lượt`;
  return {
    status          : true,
    bonus_str       : str,
    bonus_turn      : bonusTurn,
    bonus_sp_item   : 0,
    lsSpItemUpdate  : dataUser['sp_item']
  }
}

exports.filterHistory = (lsHistory) => {
  let lsGift = [];
  let lsCard = [];

  if (lsHistory === null || lsHistory === undefined || lsHistory.length <= 0) {
    return { ls_gift: lsGift, ls_card: lsCard };
  }

  for (let e of lsHistory) {
    let tmpH    = JSON.parse(e);
    let timeStr = convertMilliToStr(tmpH['time']);

    let tmpItem = config.ARR_ITEM.find(ee => { return ee['id'] === tmpH['id_item'] });
    let tmpP    = config.PARTITIONS.data.find(ee => { return ee['id'] === tmpH['id_item'] });
    if (tmpP !== null && tmpP !== undefined && tmpItem !== null && tmpItem !== undefined) {
      switch(tmpItem['type']) {
        case 0: {
          lsGift.push({
            id          : tmpItem['id'],
            description : tmpItem['name'],
            time        : timeStr,
            region      : tmpP['region']
          });
          break;
        }
        case 1: {
          lsCard.push({
            id          : tmpItem['id'],
            description : tmpItem['name'],
            time        : timeStr,
            region      : tmpP['region']
          });
          break;
        }
      }
    }
  }

  return {
    ls_gift : lsGift,
    ls_card : lsCard
  }
}

exports.filterGiftFrom = (lsGift, lsSpecialItem) => {
  for (let i of lsSpecialItem) {
    let strs = i.split('_');                            //{id}_{millisecond}
    let item = config.SPECIAL_ITEM.find(e => { return e['id'] === parseInt(strs[0], 10) });
    if (item !== null && item !== undefined) {
      lsGift.push({
        id          : item['id'],
        description : item['description'],
        time        : convertMilliToStr(parseInt(strs[1], 10)),
        region      : item['region']
      });
    }
  }
}

exports.convertLsLuckyCode = (lsLuckyCode) => {
  let filter = [];
  for (let c of lsLuckyCode) {
    let tmp     = c.split('_');
    let timeStr = convertMilliToStr(parseInt(tmp[1], 10));
    filter.push({ code: tmp[0], time: timeStr });
  }
  return filter;
}

exports.getNotificaBanner = async () => {
  let arrNoti = [];
  let time    = new Date();

  let data    = await redisClient.getNotificaBanner();
  for (let e of data) {
    let tmp     = e.split('_');
    let tmpTime = parseInt(tmp['2']);
    if (time.getTime() - tmpTime < 1500000) {
      arrNoti.push(`Chúc mừng ${tmp[0]} đã trúng được ${tmp[1]}`);
    }
  }
  return arrNoti;
}

exports.getSpItemById = (lsSpItem, idSpItem) => {
  let cfgSpItem = config.SUPPORTING_ITEM.find(e => { return e['id'] === idSpItem });
  if (cfgSpItem === null || cfgSpItem === undefined) return { status: false, msg: 'Can not get cfgSpItem!' };

  for (let e of lsSpItem) {
    let split   = e.split('_');
    let id      = parseInt(split[0], 10);
    let amount  = parseInt(split[1], 10);

    if (isNaN(id) || isNaN(amount)) return { status: false, msg: 'Invalid id or amount!' };

    if (id === idSpItem) {
      return {
        status  : true,
        amount  : amount
      }
    }
  }
  return { status: false, msg: 'idSpItem not exist!' };
}

exports.getHistoryEnterCode = (lsHistoryEnterCode) => {
  let his = [];
  for (let e of lsHistoryEnterCode) {
    let str         = e.split('_');
    let timeConvert = convertMilliToStr(parseInt(str[3], 10));
    his.push({
      code  : hideCodeXXX(str[0]),
      time  : timeConvert
    });
  }
  return his;
}

exports.isBlockAcc = (obj) => {
  let date0   = new Date(obj['rule_1']['time']);
  let date1   = new Date(obj['rule_2']['time']);
  let dateNow = new Date();

  if (dateNow.getTime() <= date1.getTime() &&
      obj['rule_2']['count'] >= config.RULE_BLOCK_ACC[1]['max_failed']) {
    return {
      status      : true,
      max_failed  : config.RULE_BLOCK_ACC[1]['max_failed'],
      time_block  : convertMilliToStr(obj['rule_2']['time'])
    };
  }
  else if (dateNow.getTime() <= date0.getTime() &&
      obj['rule_1']['count'] >= config.RULE_BLOCK_ACC[0]['max_failed']) {
    return {
      status      : true,
      max_failed  : config.RULE_BLOCK_ACC[0]['max_failed'],
      time_block  : convertMilliToStr(obj['rule_1']['time'])
    };
  }
  return { status: false };
}

exports.updateBlockAccUser = (blockAcc) => {
  let timeNow   = new Date();
  let timeRule1 = new Date(blockAcc['rule_1']['time']);
  let timeRule2 = new Date(blockAcc['rule_2']['time']);

  let deltaTimeRule1 = timeNow.getTime() - timeRule1.getTime();
  let deltaTimeRule2 = timeNow.getTime() - timeRule2.getTime();

  //check rule 1
  if (blockAcc['rule_1']['count'] >= config.RULE_BLOCK_ACC[0]['max_failed']) {
    blockAcc['rule_1']['count'] = 1;
    blockAcc['rule_1']['time']  = timeNow.getTime();
  }
  else if (deltaTimeRule1 <= config.RULE_BLOCK_ACC[0]['sequent_time']) {
    blockAcc['rule_1']['count'] += 1;
  }
  else {
    blockAcc['rule_1']['count'] = 1;
    blockAcc['rule_1']['time']  = timeNow.getTime();
  }

  //check rule 2
  if (blockAcc['rule_2']['count'] >= config.RULE_BLOCK_ACC[1]['max_failed']) {
    blockAcc['rule_2']['count'] = 1;
    blockAcc['rule_2']['time']  = timeNow.getTime();
  }
  else if (deltaTimeRule2 <= config.RULE_BLOCK_ACC[1]['sequent_time']) {
    blockAcc['rule_2']['count'] += 1;
  }
  else {
    blockAcc['rule_2']['count'] = 1;
    blockAcc['rule_2']['time']  = timeNow.getTime();
  }

  //check max input code failed
  if (blockAcc['rule_1']['count'] >= config.RULE_BLOCK_ACC[0]['max_failed']) {
    blockAcc['rule_1']['time'] = timeNow.getTime() + config.RULE_BLOCK_ACC[0]['time_block'];
  }

  if (blockAcc['rule_2']['count'] >= config.RULE_BLOCK_ACC[1]['max_failed']) {
    blockAcc['rule_2']['time'] = timeNow.getTime() + config.RULE_BLOCK_ACC[1]['time_block'];
  }

  return blockAcc;
}

exports.resetBlockAccUser = (blockAcc) => {
  blockAcc['rule_1']['count'] = 0;
  blockAcc['rule_1']['time']  = 0;
  blockAcc['rule_2']['count'] = 0;
  blockAcc['rule_2']['time']  = 0;
  return blockAcc;
}

exports.isResBlockAccUser = (rep, dataUser) => {
  let resultBlockAcc = this.isBlockAcc(dataUser['block_acc']);
  if (resultBlockAcc['status']) {
    rep.send({
      status_code : 2500,
      max_failed  : resultBlockAcc['max_failed'],
      time_block  : resultBlockAcc['time_block']
    });
    return true;
  }
  return false;
}

//-------------------------------------functional-----------------------------------------
function hideCodeXXX(code) {
  return code.substring(0, 5) + 'XXXXX';
}

function convertMilliToStr(milli) {
  let time    = new Date(milli + 7 * 3600 * 1000);
  let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth()+1;
  let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
  let year    = time.getFullYear();
  let hour    = time.getHours() < 10 ? `0${time.getHours()}` : time.getHours();
  let minute  = time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes();
  return `${hour}:${minute}   ${date}/${month}/${year}`;
}