const profileFunc             = require('./profile_user_func');
const util                    = require('../utils/util');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

/**
 * event với id = 0 là event đặc biệt. x2/setnumber số lượt cho user khi nhập code trong thời gian event này diễ ra
 * @key did -> lấy số lần nhập code/phóng phi tiêu của user trong lúc event đang diẽn ra
 */
exports.filterLsEventWithSpItem = (lsEvent, lsEventDid) => {
  let filter = [];
  for (let m of config.EVENTS.data) {
    if (m['status'] === 1) {

      let resultGetDid;
      if (m['type'] === 0) {
        resultGetDid = getEventDid(m['id'], m['target'], lsEventDid, lsEvent[0]);
      }
      else if (m['type'] === 1) {
        resultGetDid = getEventDid(m['id'], m['target'], lsEventDid, lsEvent[1]);
      }
      else if (m['type'] === 2) {
        resultGetDid = getEventDid(m['id'], m['target'], lsEventDid, lsEvent[2]);
      }
      else if (m['type'] === 3) {
        resultGetDid = getEventDid(m['id'], m['target'], lsEventDid, lsEvent[3]);
      }

      let status    = true;
      let fromDate  = this.convertStrDateEvent(config.EVENTS['start'], true);
      let toDate    = this.convertStrDateEvent(config.EVENTS['end'], false);
      if (m['id'] === 0) {
        fromDate  = this.convertStrDateEvent(m['from_date'], true);
        toDate    = this.convertStrDateEvent(m['to_date'], false);
      }

      if (m['id'] === 0 && !util.isEligibleEventById0(m['from_date'], m['to_date'])) {
        status = false;
      } //status x2 event
      
      if (m['sp_item'] !== null && m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : resultGetDid['did'],
          is_finish     : resultGetDid['is_finish'],
          status        : status,
          bonus_str_1   : `${m['bonus_turn']} LƯỢT`,
          bonus_str_2   : `${m['bonus_sp_item']} ${m['sp_item']['description']}`,
          from_date     : fromDate,
          to_date       : toDate
        });
      }
      else if (m['sp_item'] !== null && m['bonus_turn'] <= 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : resultGetDid['did'],
          is_finish     : resultGetDid['is_finish'],
          status        : status,
          bonus_str_1   : '',
          bonus_str_2   : `${m['bonus_sp_item']} ${m['sp_item']['description']}`,
          from_date     : fromDate,
          to_date       : toDate
        });
      }
      else if (m['bonus_turn'] > 0) {
        filter.push({
          id            : m['id'],
          description   : m['description'],
          target        : m['target'],
          did           : resultGetDid['did'],
          is_finish     : resultGetDid['is_finish'],
          status        : status,
          bonus_str_1   : `${m['bonus_turn']} LƯỢT`,
          bonus_str_2   : '',
          from_date     : fromDate,
          to_date       : toDate
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

      if (dataUser['events'][0] < tmpEvent['target'] || dataUser['event_did'].includes(tmpEvent['id']))
        return { status: false, msg: 'Not eligible yet!' };

      resultBonus = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['event_did'].push(tmpEvent['id']);

      break;
    }
    case 1: {

      if (dataUser['events'][1] < tmpEvent['target'] || dataUser['event_did'].includes(tmpEvent['id']))
        return { status: false, msg: 'Not eligible yet!' };

      resultBonus = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['event_did'].push(tmpEvent['id']);

      break;
    }
    case 3: {

      //với case = 3 (event share fb) user chỉ làm một lần trong suốt thời gian event đang diễn ra. với thời gian event khác được làm lại

      if (dataUser['events'][3] >= tmpEvent['target'] || dataUser['event_did'].includes(tmpEvent['id']))
        return { status: false, msg: 'Not eligible yet!' };

      resultBonus = profileFunc.getBonusFromMissionOrEvent(tmpEvent, dataUser);
      dataUser['events'][3] += tmpEvent['target'];
      dataUser['event_did'].push(tmpEvent['id']);

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
    dataUserUpdate  : dataUser,
    id_event        : tmpEvent['id']
  };
}

//----------------------------------functional-----------------------------------------
exports.convertStrDateEvent = (strDate, isFrom) => {
  let tmp   = strDate.split(' ');
  let tmp1  = tmp[0].split('-');
  if (isFrom) {
    let tmpDate = new Date(strDate);
    let date    = new Date(tmpDate.getTime() + 7 * 3600 * 1000);
    let month   = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    let datee   = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    let year    = date.getFullYear();
    return `00:00 ${datee}/${month}/${year}`;
  }
  return `23:59 ${tmp1[2]}/${tmp1[1]}/${tmp1[0]}`;
}

function getEventDid(idEvent, target, lsEventDid, countEventDid) {
  if (lsEventDid.includes(idEvent)) {
    return {
      did       : target,
      is_finish : true
    };
  }
  else {
    let did = (countEventDid >= target) ? target : countEventDid;
    return {
      did       : did,
      is_finish : false
    };
  }
}