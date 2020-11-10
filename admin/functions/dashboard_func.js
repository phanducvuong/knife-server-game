const DS            = require('../../repository/datastore');
const util          = require('../../utils/util');

exports.getAllDataUser = async (lsMegaID) => {
  let lsDataUser = [];
  for (let m of lsMegaID) {
    let dataUser = await DS.DSGetDataUser(m, 'turn_inven');
    if (dataUser !== null && dataUser !== undefined) {
      lsDataUser.push({
        mega_code : m,
        data_user : dataUser
      });
    }
  }
  return lsDataUser;
}

exports.getHistoryAllUser = async (lsMegaID) => {
  let lsHistory = [];
  for (let m of lsMegaID) {
    let [his, dataUser] = await Promise.all([
      DS.DSGetDataUser(m, 'histories'),
      DS.DSGetDataUser(m, 'turn_inven')
    ]);
    if (his !== null && his !== undefined && his['history'] !== null && his['history'] !== undefined) {
      lsHistory.push({
        mega_code : m,
        province  : dataUser['province'],
        histories : his['history']
      });
    }
  }
  return lsHistory;
}

exports.totalUniqueUserJoinGame = (lsMegaID, lsDataUser, fromDate, toDate) => {
  let total = 0;
  for (let u of lsMegaID) {
    let dataUserFind = lsDataUser.find(e => { return e['mega_code'] === u });
    if (dataUserFind !== null && dataUserFind !== undefined) {
      for (let milli of dataUserFind['data_user']['date_login']) {
        if (chkTimeInRange(fromDate.getTime(), toDate.getTime(), milli)) {
          total += 1;
          break;
        }
      }
    }
  }
  // console.log('\n------------------')
  return total;
}

exports.totalNewbieUserByDate = (lsMegaID, lsDataUser, milli) => {
  let total = 0;
  for (let u of lsMegaID) {
    let dataUserFind = lsDataUser.find(e => { return e['mega_code'] === u });
    if (dataUserFind !== null && dataUserFind !== undefined) {
      if (util.chkTheSameDate(dataUserFind['data_user']['date_login'][0], milli)) {
        total += 1;
      }
    }
  }
  return total;
}

exports.totalTurnCreateByDate = (lsMegaID, lsDataUser, milli) => {
  let total = 0;
  for (let u of lsMegaID) {
    let dataUserFind = lsDataUser.find(e => { return e['mega_code'] === u });
    if (dataUserFind !== null && dataUserFind !== undefined) {
      total += getTotalTurnBy(milli, dataUserFind['data_user']['log_get_turn']['from_mission']);
      total += getTotalTurnBy(milli, dataUserFind['data_user']['log_get_turn']['from_enter_code']);
    }
  }
  return total;
}

exports.totalTurnUsedByDate = (lsMegaID, lsHisAllUser, millisecond) => {
  let total = 0;
  for (let u of lsMegaID) {
    let hisUserFind = lsHisAllUser.find(e => { return e['mega_code'] === u });
    if (hisUserFind !== null && hisUserFind !== undefined) {
      for (let his of hisUserFind['histories']) {
        let json  = JSON.parse(his);
        let milli = json['time'] + 7 * 3600 * 1000;
        if (util.chkTheSameDate(millisecond, milli)) {
          total += 1;
        }
      }
    }
  }
  return total;
}

//-------------------------------functional--------------------------------------
function chkTimeInRange(fromMilli, toMilli, milli) {
  let changeTimeZoneMilli = milli + 7 * 3600 * 1000;
  let d = new Date(changeTimeZoneMilli);
  d.setHours(0, 0, 0, 0);

  if (fromMilli === toMilli && util.chkTheSameDate(d.getTime(), fromMilli)) {
    // console.log(`from: ${fromMilli}]    to: ${toMilli}`);
    return true;
  }
  else if (d.getTime() >= fromMilli && d.getTime() <= toMilli) {
    // console.log(`[change: ${changeTimeZoneMilli}     from: ${fromMilli}]    to: ${toMilli}`);
    return true;
  }
  return false;
}

function getTotalTurnBy(millisecond, lsFrom) {
  let total = 0;
  for (let f of lsFrom) {
    let split = f.split('_');                                 //f = {id}_{new-turn-user}_{bonus-turn}_{timestamp}
    // let milli = parseInt(split[3], 10) + 7 * 3600 * 1000;
    let milli = parseInt(split[3], 10);
    if (util.chkTheSameDate(milli, millisecond)) {
      total += parseInt(split[2], 10);
    }
  }
  return total;
}