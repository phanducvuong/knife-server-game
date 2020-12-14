const DS              = require('../../repository/datastore');
const dashboardFunc   = require('./dashboard_func');
const util            = require('../../utils/util');
const redisClient     = require('../../redis/redis_client');
const generateStr     = require('../../utils/generate_string');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

exports.filterOptionItem = async () => {
  let lsAllItem = await DS.DSGetAllItem();
  let filter    = [];
  for (let i of lsAllItem) {
    if (i['type'] !== -1) {
      filter.push({
        id    : i['id'],
        name  : i['name']
      });
    }
  }
  return filter;
}

exports.getTotalAmountItemBy = async (idItem, millisecond) => {
  let total         = 0;
  let lsAllMegaID   = await DS.DSGetAllUser();
  let lsHisAllUser  = await dashboardFunc.getHistoryAllUser(lsAllMegaID);
  let itemFind      = config.ARR_ITEM.find(e => { return e['id'] === idItem });

  if (itemFind === null || itemFind === undefined) {
    return { status: false };
  }

  let item = {
    id      : itemFind['id'],
    name    : itemFind['name'],
    type    : itemFind['type']
  }

  if (itemFind['type'] === 2) {
    for (let d of lsHisAllUser) {
      for (let his of d['histories']) {
        let json  = JSON.parse(his);                                           //{code}_{millisecond}
        let milli = json['time'] + 7 * 3600 * 1000;
        if (json['code'].length > 2 && util.chkTheSameDate(millisecond, milli)) {
          total += 1;
        }
      }
    }
  } //get total lucky_code is created by date
  else {
    for (let u of lsHisAllUser) {
      for (let his of u['histories']) {
        let json    = JSON.parse(his);
        let milli   = json['time'] + 7 * 3600 * 1000;
        if (idItem === json['id_item'] && util.chkTheSameDate(millisecond, milli)) {
          total += 1;
        }
      }
    }
  }

  return {
    status  : true,
    item    : item,
    total   : total,
  };
}

exports.getListItemSpecialUser = (lsSpecialItem) => {
  let tmp = [];
  for (let s of lsSpecialItem) {
    let ss              = s.split('_');                                                           //{id_special_item}_{millisecond}
    let specialItemFind = config.SPECIAL_ITEM.find(e => { return e['id'] === parseInt(ss[0]) });
    if (specialItemFind !== null && specialItemFind !== undefined) {
      tmp.push({
        id          : specialItemFind['id'],
        description : specialItemFind['description'],
        millisecond : ss[1],
        time        : util.convertTimeToString(parseInt(ss[1], 10))
      });
    }
  }
  return tmp;
}

exports.delSpecialItemUser = (lsSpecialItem, condition) => {
  let specialItemFind = lsSpecialItem.find(e => { return e === condition });
  if (specialItemFind === null || specialItemFind === undefined) {
    return { status: false };
  }

  let index = lsSpecialItem.indexOf(specialItemFind);
  lsSpecialItem.splice(index, 1);
  return {
    status                  : true,
    ls_special_item_update  : lsSpecialItem,
    special_item            : specialItemFind
  };
}

//action: 0 -> del, 1 -> add
exports.updateLuckyCodeUser = async (luckyCodes, dataUser, action) => {
  if (!chkLsLuckyCodeFollowByRule(luckyCodes)) return { status: false, msg: 'Invalid list lucky code!' };

  let date = new Date();
  if (action === 0) {
    let tmpLuckyCodeFail = '';
    for (let l of luckyCodes) {
      let tmp = dataUser['lucky_code'].find(e => {
        let s = e.split('_');
        if (s[0] === l) return e;
        tmpLuckyCodeFail = l;
        return null;
      });

      if (tmp === null || tmp === undefined) return { status: false, msg: `Some code is not exist! ${tmpLuckyCodeFail}` };
      let index = dataUser['lucky_code'].indexOf(tmp);
      dataUser['lucky_code'].splice(index, 1);

      DS.DSDelLuckyCodeBy('lucky_code_s1', l);
    }
    return { status: true, dataUserUpdate: dataUser };
  } //del lucky code

  if (await isValidLuckyCodes(luckyCodes) === false) return { status: false, msg: 'Invalid list lucky code!' };
  for (let l of luckyCodes) {
    dataUser['lucky_code'].push(`${l}_${date.getTime()}`);
    DS.DSInsertLuckyCode('lucky_code_s1', { code: l, time: date.getTime() });
  } //add lucky code
  return { status: true, dataUserUpdate: dataUser };
}

exports.enterCodesForUser = async (megaID, dataUser, codes) => {
  let date          = new Date();
  let tmpSaveStages = [];
  for (let c of codes) {
    let codeDS = await DS.DSGetCode(config.K, util.genEnterCode(c));
    if (codeDS === null || codeDS === undefined || codeDS['data']['used'] !== 0) return { status: false, msg: `${c} is not exist or used!` };

    let tmpCode = tmpSaveStages.find(e => { return e['code'] === c });
    if (tmpCode !== null && tmpCode !== undefined) return { status: false, msg: `The same code ${tmpCode['code']}` };

    let strGenerate = '';
    let bonusTurn   = 0;
    if (dataUser['log_get_turn']['from_enter_code'].length % 2 === 0) {
      bonusTurn = config.BONUS_ENTER_CODE['bonus_1']['bonus_turn'];
      if (config.BONUS_ENTER_CODE['bonus_1']['bonus_lucky_code'] > 0) {
        strGenerate   = generateStr.getStringGenerate();
        if (await DS.DSIsExistLuckyCode('lucky_code_s1', strGenerate) === true) return { status: false, msg: 'MCH. Enter code failed!' };
        dataUser['lucky_code'].push(`${strGenerate}_${date.getTime()}`);
      }
    }
    else {
      bonusTurn = config.BONUS_ENTER_CODE['bonus_2']['bonus_turn'];
      if (config.BONUS_ENTER_CODE['bonus_2']['bonus_lucky_code'] > 0) {
        strGenerate   = generateStr.getStringGenerate();
        if (await DS.DSIsExistLuckyCode('lucky_code_s1', strGenerate) === true) return { status: false, msg: 'MCH. Enter code failed!' };
        dataUser['lucky_code'].push(`${strGenerate}_${date.getTime()}`);
      }
    }

    if (util.chkTimeEvent(config.EVENTS['start'], config.EVENTS['end'])) {
      dataUser['events'][0] += 1;
    }

    if (util.isEligibleEventById0(config.EVENTS['data'][0]['from_date'], config.EVENTS['data'][0]['to_date']) &&
          config.EVENTS['data'][0]['status'] === 1) {
        bonusTurn         *= config.EVENTS['data'][0]['mul'];
    } //x2_bonus_turn nếu events đang diễn ra

    tmpSaveStages.push({
      code    : c,
      code_ds : codeDS,
      str_gen : strGenerate
    });

    dataUser['turn']        += bonusTurn;
    dataUser['actions'][0]  += 1;
    dataUser['log_get_turn']['from_enter_code'].push(`${c}_${dataUser['turn']}_${bonusTurn}_${date.getTime()}_${strGenerate}`);
  }

  for (let c of tmpSaveStages) {
    DS.DSImportCode(config.KIND_CODE, c['code_ds']['id'], {
      code      : c['code_ds']['data']['code'],
      used      : 1,
      name      : dataUser['name'],
      province  : dataUser['province'],
      phone     : dataUser['phone'],
      time      : date.getTime()
    });

    if (c['str_gen'].length > 2)
      DS.DSInsertLuckyCode('lucky_code_s1', { code: c['str_gen'], time: date.getTime() });
  }

  redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
  DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

  return {
    status  : true,
    msg     : 'Success'
  };
}

exports.removeCodeGetTurn = async (megaID, dataUser, code) => {
  let minusTurn = -1;
  let luckyCode = 'none';
  let enterCode = '';
  for (let l of dataUser['log_get_turn']['from_enter_code']) {
    let tmp = l.split('_');
    if (tmp['0'] === code) {
      minusTurn = parseInt(tmp[2], 10);
      luckyCode = tmp[4];
      enterCode = l;
      break;
    }
  }

  if (minusTurn === -1 || luckyCode === 'none') return { status: false, msg: `1.${code} is not exist!` };

  let codeDS = await DS.DSGetCode(config.KIND_CODE, util.genEnterCode(code));
  if (codeDS === null || codeDS === undefined) return { status: false, msg: `2.${code} is not exist!` };

  let index = dataUser['log_get_turn']['from_enter_code'].indexOf(enterCode);
  dataUser['log_get_turn']['from_enter_code'].splice(index, 1);

  index = getIndexOfLuckyCodeFromUser(dataUser['lucky_code'], luckyCode);
  if (index >= 0) dataUser['lucky_code'].splice(index, 1);

  dataUser['turn'] -= minusTurn;
  if (dataUser['turn'] < 0) dataUser['turn'] = 0;

  dataUser['actions'][0] -= 1;
  if (dataUser['actions'][0] < 0) dataUser['actions'] = 0;

  if (util.chkTimeEvent(config.EVENTS['start'], config.EVENTS['end'])) {
    dataUser['events'][0] -= 1;
    if (dataUser['events'][0] < 0) dataUser['events'][0] = 0;
  }

  //reset code
  DS.DSImportCode(config.KIND_CODE, codeDS['id'], {
    code      : codeDS['data']['code'],
    used      : 0
  });

  //remove lucky code in lucky_code_s1
  DS.DSDelLuckyCodeBy('lucky_code_s1', luckyCode);

  redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
  DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

  return {
    status      : true,
    msg         : 'Success',
    turn        : dataUser['turn'],
    lucky_code  : luckyCode
  };
}

//----------------------------------------------------function--------------------------------------------------
async function isValidLuckyCodes(luckyCodes) {
  for (let l of luckyCodes) {
    let isExist = await DS.DSIsExistLuckyCode('lucky_code_s1', l);
    if (isExist) {
      return false;
    }
  }
  return true;
}

function chkLsLuckyCodeFollowByRule(luckyCodes) {
  for (let l of luckyCodes) {
    if (l.length !== 6 || l.includes('0') || l.includes('O') || l.includes('I')) {
      return false;
    }
  }
  return true;
}

function getIndexOfLuckyCodeFromUser(luckyCodes, code) {
  for (let l of luckyCodes) {
    let tmp = l.split('_');                                       // {lucky_code}_{time}
    if (tmp[0] === code) {
      return luckyCodes.indexOf(l);
    }
  }
  return -1;
}