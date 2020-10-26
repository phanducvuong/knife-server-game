const profileFunc             = require('./profile_user_func');
const util                    = require('../utils/util');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.filterLsEventWithSpItem = (lsEvent) => {
  let filter = [];
  for (let m of config.EVENTS.data) {
    if (m['status'] === 1) {
      let did     = 0;
      if (m['type'] === 0)      did = lsEvent[0];
      else if (m['type'] === 1) did = lsEvent[1];
      else if (m['type'] === 2) did = lsEvent[2];

      let status  = true;
      if (m['id'] === 0 && !util.isEligibleEventById0(m['from_date'], m['to_date'])) {
        status = false;
      }
      
      if (m['sp_item'] !== null && m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : did,
          status        : status,
          bonus_str_1   : `${m['bonus_turn']} lượt`,
          bonus_str_2   : `${m['bonus_sp_item']} ${m['sp_item']['description']}`
        });
      }
      else if (m['sp_item'] !== null && m['bonus_turn'] <= 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : did,
          status        : status,
          bonus_str_1   : '',
          bonus_str_2   : `${m['bonus_sp_item']} ${m['sp_item']['description']}`
        });
      }
      else if (m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : did,
          status        : status,
          bonus_str_1   : `${m['bonus_turn']} Lượt`,
          bonus_str_2   : ''
        });
      }
    }
  }
  return filter;
}

exports.joinEvent = (dataUser, idEvent) => {
  let tmpEvent = config.EVENTS.data.find(e => { return e['id'] === idEvent && e['status'] === 1 });
  if (tmpEvent === null || tmpEvent === undefined) return { status: false, msg: 'Can not get tmpEvent!' };

  let resultBonus;
  switch (tmpEvent['type']) {
    case 0: {

      if (dataUser['events'][0] < tmpEvent['target'] || !util.isEligibleEventById0(tmpEvent['from_date'], tmpEvent['to_date']))
        return { status: false, msg: 'Not eligible yet!' };

      resultBonus            = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['events'][0] -= tmpEvent['target'];

      break;
    }
    case 1: {

      if (dataUser['events'][1] < tmpEvent['target']) return { status: false, msg: 'Not eligible yet!' };
      resultBonus            = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['events'][1] -= tmpEvent['target'];

      break;
    }
    default: {
      return { status: false, msg: 'Type event is not exist! Default switch!' };
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