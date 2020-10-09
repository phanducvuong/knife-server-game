const profileFunc           = require('./profile_user_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.filterMisisonWithSpItem = (lsMissionUser) => {
  let filter = [];
  for (let m of config.MISSIONS) {
    if (m['status'] === 1 && !lsMissionUser.includes(m['id'])) {

      //status reset mission. 0 -> everyday, 1 -> one time
      let status = 0;
      if (m['id'] === 0) status = 1;

      //mission filter
      if (m['sp_item'] !== null && m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_turn']} Lượt, ${m['bonus_sp_item']} ${m['sp_item']['description']}`,
          status        : status
        });
      }
      else if (m['sp_item'] !== null && m['bonus_turn'] <= 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_sp_item']} ${m['sp_item']['description']}`,
          status        : status
        });
      }
      else if (m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_turn']} Lượt`,
          status        : status
        });
      }
    }
  }
  return filter;
}

exports.getBonusFromMission = (idMission, dataUser) => {
  let missionFind = config.MISSIONS.find(e => { return e['id'] === idMission && e['status'] === 1 });
  if (missionFind === null || missionFind === undefined || dataUser['mission'].includes(idMission)) {
    return {
      status  : false,
      msg     : 'Can not get mission or mission is completed!'
    };
  }

  //TODO: check mission at type = 2
  let resultBonus;

  switch (missionFind['type']) {
    case 0: {

      if (dataUser['actions'][0] < missionFind['target']) return { status: false, msg: 'Not eligible yet!' };
      resultBonus = profileFunc.getBonusFromMissionOrEvent(missionFind, dataUser);
      dataUser['mission'].push(missionFind['id']);
      break;

    }
    case 1: {

      if (dataUser['actions'][1] < missionFind['target']) return { status: false, msg: 'Not eligible yet!' };
      resultBonus = profileFunc.getBonusFromMissionOrEvent(missionFind, dataUser);
      dataUser['mission'].push(missionFind['id']);
      break;

    }
    default: {

      resultBonus = profileFunc.getBonusFromMissionOrEvent(missionFind, dataUser);
      dataUser['mission'].push(missionFind['id']);
      break;

    }
  }

  if (!resultBonus['status']) return { status: false, msg: resultBonus['msg'] };

  dataUser['turn']     += resultBonus['bonus_turn'];
  dataUser['sp_item']   = resultBonus['lsSpItemUpdate'];
  return {
    status          : true,
    bonusStr        : resultBonus['bonus_str'],
    dataUserUpdate  : dataUser
  };
}

//------------------------------------functional------------------------------------
function getBonusFromMission(mission, dataUser) {
  if (mission['bonus_turn'] > 0 && mission['bonus_sp_item'] > 0) {
    let str         = `${mission['bonus_turn']} lượt và ${mission['bonus_sp_item']} ${mission['sp_item']['description']}`;
    let resultBonus = profileFunc.incrSpItemInLsSpItemById(dataUser['sp_item'], mission['sp_item']['id'], mission['bonus_sp_item']);

    if (!resultBonus['status']) return { status: false, msg: resultBonus['msg'] };
    return {
      status          : true,
      bonusStr        : str,
      bonus_turn      : mission['bonus_turn'],
      lsSpItemUpdate  : resultBonus['data']
    }
  }
  else if (mission['bonus_turn'] === 0 && mission['bonus_sp_item'] > 0) {
    let str         = `${mission['bonus_sp_item']} ${mission['sp_item']['description']}`;
    let resultBonus = profileFunc.incrSpItemInLsSpItemById(dataUser['sp_item'], mission['sp_item']['id'], mission['bonus_sp_item']);

    if (!resultBonus['status']) return { status: false, msg: resultBonus['msg'] };
    return {
      status          : true,
      bonusStr        : str,
      bonus_turn      : 0,
      lsSpItemUpdate  : resultBonus['data']
    }
  }
  else {
    str = `${mission['bonus_turn']} lượt`;
    return {
      status          : true,
      bonusStr        : str,
      bonus_turn      : mission['bonus_turn'],
      lsSpItemUpdate  : dataUser['sp_item']
    }
  }
}