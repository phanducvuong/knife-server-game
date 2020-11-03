const DS              = require('../../repository/datastore');
const util            = require('../../utils/util');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

exports.getAllDataUser = async () => {
  let lsAllMegaID = await DS.DSGetAllUser();
  let lsDatatUser = [];
  for (let m of lsAllMegaID) {
    let dataUser = await DS.DSGetDataUser(m, 'turn_inven');
    if (dataUser !== null && dataUser !== undefined) {
      lsDatatUser.push({
        mega_code : m,
        data      : dataUser
      });
    }
  }
  return lsDatatUser;
}

//lsDataUser: { mega_code: string, data: [obj-json] }
exports.getHistoryAllUser = async (lsDataUser) => {
  let lsHistoryAllUser = [];
  for (let m of lsDataUser) {
    let result = await DS.DSGetDataUser(m['mega_code'], 'histories');
    if (result !== null && result !== undefined && result['history'] !== null && result['history'] !== undefined && result['history'].length > 0) {
      lsHistoryAllUser.push({
        mega_code : m['mega_code'],
        phone     : m['data']['phone'],
        data      : result['history']
      });
    }
  }
  return lsHistoryAllUser;
}

exports.getDetailInfoUser = async (megaID) => {
  let [lsHistory, dataUser] = await Promise.all([
    DS.DSGetDataUser(megaID, 'histories'),
    DS.DSGetDataUser(megaID, 'turn_inven')
  ]);

  if (dataUser === null || dataUser === undefined) {
    return { status: false, msg: 'Data User Not Exist!' };
  }

  let detailGetBonusTurn;
  let detailGiftsAndTeleCards;
  if (lsHistory === null || lsHistory === undefined) {
    detailGiftsAndTeleCards = getDetailGiftAndTeleCard([]);
  }
  else {
    detailGiftsAndTeleCards = getDetailGiftAndTeleCard(lsHistory['history']);
  }
  detailGetBonusTurn = getDetailBonusTurn(dataUser['log_get_turn']['from_mission'], dataUser['log_get_turn']['from_enter_code']);

  return {
    status              : true,
    detailGetBonusTurn  : detailGetBonusTurn,
    lsGift              : detailGiftsAndTeleCards['lsGift'],
    lsTeleCard          : detailGiftsAndTeleCards['lsTeleCard']
  }
}

exports.getGeneralInfo = (lsDataUser) => {
  let lsGeneral = [];
  for (let d of lsDataUser) {
    let total_turn = d['data']['total_turned'] + d['data']['turn'];
    lsGeneral.push({
      total_turn        : total_turn,
      mega_code         : d['mega_code'],
      phone             : d['data']['phone'],
      total_turned      : d['data']['total_turned'],
      turn_remain       : d['data']['turn'],
      amount_enter_code : d['data']['log_get_turn']['from_enter_code'].length
    });
  }
  return lsGeneral;
}

exports.getTurnningInfo = (lsHistoryAllUser) => {
  let lsTurnningInfo = [];
  for (let h of lsHistoryAllUser) {
    for (let d of h['data']) {
      let obj       = JSON.parse(d);
      let itemFind  = config.ARR_ITEM.find(e => { return e['id'] === obj['id_item'] });
      if (itemFind !== null && itemFind !== undefined) {
        let timeConvert = util.convertTimeToString(obj['time']);
        lsTurnningInfo.push({
          mega_code   : h['mega_code'],
          phone       : h['phone'],
          reward      : itemFind['name'],
          time        : timeConvert
        });
      }
    }
  }
  return lsTurnningInfo;
}

exports.getEnterCodeInfo = (lsAllDataUser) => {
  let lsEnterCodeInfo = [];
  for (let m of lsAllDataUser) {
    for (c of m['data']['log_get_turn']['from_enter_code']) {
      let s = c.split('_');
      let t = util.convertTimeToString(parseInt(s[3], 10));
      lsEnterCodeInfo.push({
        mega_code : m['mega_code'],
        phone     : m['phone'],
        code      : s[0],
        time      : t
      });
    }
  }
  return lsEnterCodeInfo;
}

exports.getAllNameOfLsItems = () => {
  let tmp = [];
  for (let e of config.ARR_ITEM) {
    tmp.push({
      name : e['name']
    });
  }
  return tmp;
}

//--------------------------------------------functional-----------------------------------
function getDetailBonusTurn(fromMission, fromEnterCode) {
  //from mission
  let lsFromMission = [];
  for (m of fromMission) {
    let strValue    = m.split('_');
    let missionFind = config.MISSIONS.find(e => { return e['id'] === parseInt(strValue[0], 10) });
    if (missionFind !== null && missionFind !== undefined) {
      lsFromMission.push({
        id_mission  : strValue[0],
        description : missionFind['description'],
        new_turn    : strValue[1],
        bonus       : strValue[2],
        time        : parseInt(strValue[3], 10)
      });
    }
  }

  //from enter code
  let lsFromEnterCode = [];
  for (c of fromEnterCode) {
    let strValue = c.split('_');
    lsFromEnterCode.push({
      code  : `Code: ${strValue[0]}`,
      turn  : strValue[1],
      bonus : strValue[2],
      time  : parseInt(strValue[3], 10)
    });
  }

  return {
    detailFromMission   : lsFromMission,
    detailFromEnterCode : lsFromEnterCode
  }
}

function getDetailGiftAndTeleCard(lsHistory) {
  let lsGift = [], lsTeleCard = [];
  for (let h of lsHistory) {
    let obj       = JSON.parse(h);
    let itemFind  = config.ARR_ITEM.find(e => { return e['id'] === obj['id_item'] });
    if (itemFind !== null && itemFind !== undefined) {
      switch(itemFind['type']) {
        case 0: {
          lsGift.push({
            id        : itemFind['id'],
            name      : itemFind['name'],
            newAmount : obj['amount'],
            time      : obj['time']
          });
          break;
        }
        case 1: {
          lsTeleCard.push({
            id        : itemFind['id'],
            name      : itemFind['name'],
            newAmount : obj['amount'],
            time      : obj['time']
          });
          break;
        }
      }
    }
  }

  return {
    lsGift      : lsGift,
    lsTeleCard  : lsTeleCard
  }
}