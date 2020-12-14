const userInfoFunc              = require('./user_info_func');
const util                      = require('../../utils/util')

exports.getTopEnterCodeByProvince = async (fromDate, toDate) => {
  let lsAllDataUser = await userInfoFunc.getAllDataUser();
  let arrProvince   = [];
  let arrSumCode    = [];
  
  for (let d of lsAllDataUser) {
    let resultSum = sumEnterCodeSingleUserByRangeDate(fromDate, toDate, d['data']['log_get_turn']['from_enter_code']);
    if (resultSum > 0) {
      let provinceFind = arrProvince.find(e => { return e === d['data']['province'] });
      if (provinceFind === null || provinceFind === undefined)
        arrProvince.push(d['data']['province']);

      arrSumCode.push({
        province  : d['data']['province'],
        sum       : resultSum
      });
    }
  }

  let filter = filterTopEnterCodeByProvince(arrSumCode, arrProvince);
  return filter;
}

//--------------------------------------------functional-----------------------------------
function chkTimeInRange(fromMilli, toMilli, milli) {
  // let changeTimeZoneMilli = milli + 7 * 3600 * 1000;
  let changeTimeZoneMilli = milli;
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

function sumEnterCodeSingleUserByRangeDate(fromDate, toDate, logEnterCode) {
  let sum = 0;
  for (let c of logEnterCode) {
    let split = c.split('_');
    let milli = parseInt(split[3], 10);
    if (chkTimeInRange(fromDate.getTime(), toDate.getTime(), milli))
      sum += 1;
  }
  return sum;
}

function filterTopEnterCodeByProvince(lsSum, lsProvince) {
  let filter = [];
  for (let p of lsProvince) {
    let sum = 0;
    for (let s of lsSum) {
      if (s['province'] === p) {
        sum += s['sum']
      }
    }
    filter.push({
      province  : p,
      sum       : sum
    });
  }
  return filter;
}