const profileFunc             = require('./profile_user_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.filterLsEventWithSpItem = () => {
  let filter = [];
  for (let m of config.EVENTS.data) {
    if (m['status'] === 1) {
      if (m['sp_item'] !== null && m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_turn']} Lượt, ${m['bonus_sp_item']} ${m['sp_item']['description']}`
        });
      }
      else if (m['sp_item'] !== null && m['bonus_turn'] <= 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_sp_item']} ${m['sp_item']['description']}`
        });
      }
      else if (m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          bonus         : `${m['bonus_turn']} Lượt`
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

      if (dataUser['events'][0] < tmpEvent['target']) return { status: false, msg: 'Not eligible yet!' };
      resultBonus = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['events'][0] -= tmpEvent['target'];

      break;
    }
    case 1: {

      if (dataUser['events'][1] < tmpEvent['target']) return { status: false, msg: 'Not eligible yet!' };
      resultBonus = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
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