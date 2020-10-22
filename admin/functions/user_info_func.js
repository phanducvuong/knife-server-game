const DS              = require('../../repository/datastore');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

exports.getAllUser = async () => {
  let lsAllMegaID = await DS.DSGetAllUser();
  let lsUserInfo  = [];
  for (let m of lsAllMegaID) {
    let dataUser = await DS.DSGetDataUser(m, 'turn_inven');
    if (dataUser !== null && dataUser !== undefined) {
      lsUserInfo.push({
        mega_id   : m,
        user_name : dataUser['name'],
        phone     : dataUser['phone']
      });
    }
  }
  return lsUserInfo;
}

exports.getDetailInfoUser = async (megaID) => {
  let [lsHistory, dataUser] = await Promise.all([
    DS.DSGetDataUser(megaID, 'histories'),
    DS.DSGetDataUser(megaID, 'turn_inven')
  ]);

  if (lsHistory === null || lsHistory === undefined || lsHistory['history'] === null || lsHistory['history'] === undefined ||
      dataUser  === null || dataUser  === undefined) {
    return { status: false, msg: 'Get Data User Failed!' };
  }

  let detainGetBonusTurn      = getDetailBonusTurn(dataUser['log_get_turn']['from_mission'], dataUser['log_get_turn']['from_enter_code']);
  let detailGiftsAndTeleCards = getDetailGiftAndTeleCard(lsHistory['history']);
  let lsTeleCard          = [];
  let missionComplete     = [];
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
        id_mission  : strValue,
        description : missionFind['description'],
        turn        : strValue[1],
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