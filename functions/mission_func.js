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
  let bonus = '';
  if (missionFind['type'] === 0 && missionFind['target'] === dataUser['actions'][0]) {
    bonus = getStrBonusFromMission(missionFind);
    dataUser['mission'].push(missionFind['id']);
  }
  else if (missionFind['type'] === 1 && missionFind['target'] === dataUser['actions'][1]) {
    bonus = getStrBonusFromMission(missionFind);
    dataUser['mission'].push(missionFind['id']);
  }
  else {
    bonus = getStrBonusFromMission(missionFind);
    dataUser['mission'].push(missionFind['id']);
  }

  return {
    status          : true,
    bonus           : bonus,
    dataUserUpdate  : dataUser
  };
}

//------------------------------------functional------------------------------------
function getStrBonusFromMission(mission) {
  let str = '';
  if (mission['bonus_turn'] > 0 && mission['bonus_sp_item'] > 0) {
    str = `${mission['bonus_turn']} lượt và ${mission['bonus_sp_item']} ${mission['sp_item']['description']}`;
  }
  else if (mission['bonus_turn'] === 0 && mission['bonus_sp_item'] > 0) {
    str = `${mission['bonus_turn']} ${mission['sp_item']['description']}`;
  }
  else {
    str = `${mission['bonus_turn']} lượt`;
  }
}