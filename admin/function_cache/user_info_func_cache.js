const DS                = require('../../repository/datastore');
const util              = require('../../utils/util');
const dashboardFunc     = require('./dashboard_func_cache');
const redis             = require('../../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

exports.getAllDataUser = async () => {
  let lsAllMegaID = await redis.getAllKeyBy('turn_inven');
  let lsDatatUser = await dashboardFunc.getAllDataTurnInven(lsAllMegaID);
  return lsDatatUser;
}

//lsDataUser: { mega_code: string, data: [obj-json] }
exports.getHistoryAllUser = async (lsDataUser) => {
  let lsHistoryAllUser = [];
  for (let m of lsDataUser) {
    let result = await DS.DSGetDataUser(m['mega_code'], 'histories');
    if (result !== null && result !== undefined && result['history'] !== null && result['history'] !== undefined && result['history'].length > 0) {
      lsHistoryAllUser.push({
        mega_code   : m['mega_code'],
        phone       : m['data']['phone'],
        province    : m['data']['province'],
        name        : m['data']['name'],
        data        : result['history'],
        lucky_code  : m['data']['lucky_code']
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
    let total_turn = d['data_user']['total_turned'] + d['data_user']['turn'];
    lsGeneral.push({
      total_turn        : total_turn,
      mega_code         : d['mega_code'],
      phone             : d['data_user']['phone'],
      name              : d['data_user']['name'],
      total_turned      : d['data_user']['total_turned'],
      turn_remain       : d['data_user']['turn'],
      amount_enter_code : d['data_user']['log_get_turn']['from_enter_code'].length
    });
  }
  return lsGeneral;
}

exports.convertLsGeneralInfoToExport = (lsGeneral) => {
  let ls = [];
  for (let d of lsGeneral) {
    ls.push({
      'MEGA ID'               : d['mega_code'],
      'SĐT'                   : d['phone'],
      'SỐ CODE ĐÃ NHẬP'       : d['amount_enter_code'],
      'LƯỢT CHƠI TỔNG'        : d['total_turned'] + d['turn_remain'],
      'LƯỢT CHƠI CÒN'         : d['turn_remain'],
      'LƯỢT CHƠI ĐÃ SỬ DỤNG'  : d['total_turned']
    });
  }
  return ls;
}

exports.getTurnningInfo = (lsHistoryAllUser, lsAllDataUser) => {
  let lsTurnningInfo = [];
  for (let h of lsHistoryAllUser) {
    for (let d of h['histories']) {
			let dataUser 	= lsAllDataUser.find(e => { return e['mega_code'] === h['mega_code'] });
			let obj       = JSON.parse(d);
			let itemFind  = config.ARR_ITEM.find(e => { return e['id'] === obj['id_item'] });

			if (itemFind !== null && itemFind !== undefined && dataUser !== null && dataUser !== undefined) {
				let timeConvert = util.convertTimeToString(obj['time']);
				let reward      = itemFind['name'];
				if (itemFind['type'] === 2) {
					reward = `MCH: ${obj['code']}`;
				}

				lsTurnningInfo.push({
					mega_code   : h['mega_code'],
					name        : dataUser['data_user']['name'],
					phone       : dataUser['data_user']['phone'],
					province    : dataUser['data_user']['province'],
					reward      : reward,
					time        : timeConvert,
					milli       : obj['time']
				});
			}
		}

  //   for (let l of h['lucky_code']) {
  //     let split = l.split('_');
  //     let find  = lsTurnningInfo.find(e => { return e['reward'] === `MCH: ${split[0]}` });

  //     console.log(split[0]);
  //     console.log(find);

  //     if (find === null || find === undefined) {
  //       let time = parseInt(split[1], 10);
  //       lsTurnningInfo.push({
  //         mega_code   : h['mega_code'],
  //         name        : h['name'],
  //         phone       : h['phone'],
  //         province    : h['province'],
  //         reward      : `MCH: ${split[0]}`,
  //         time        : util.convertTimeToString(time),
  //         milli       : time
  //       });
  //     }
  //   }
  }
  return lsTurnningInfo;
}

exports.getEnterCodeInfo = (lsAllDataUser) => {
  let lsEnterCodeInfo = [];
  for (let m of lsAllDataUser) {
    for (c of m['data_user']['log_get_turn']['from_enter_code']) {
      let s = c.split('_');
      let t = util.convertTimeToString(parseInt(s[3], 10));
      lsEnterCodeInfo.push({
        mega_code   : m['mega_code'],
        name        : m['data_user']['name'],
        province    : m['data_user']['province'],
        phone       : m['data_user']['phone'],
        code        : s[0],
        lucky_code  : s[4],
        time        : t,
        milli       : parseInt(s[3], 10)
      });
    }
  }
  lsEnterCodeInfo.sort((a, b) => { return b['milli'] - a['milli'] });
  return lsEnterCodeInfo;
}

exports.getAllNameOfLsItems = () => {
  let tmp = [];
  for (let e of config.ARR_ITEM) {
    tmp.push({
      name  : e['name'],
      type  : e['type']
    });
  } //ls item

  for (let e of config.SPECIAL_ITEM) {
    tmp.push({
      name  : e['description'],
      type  : e['type']
    });
  } //ls special item
  return tmp;
}

exports.getAllCodeFail = async () => {
  let tmp           = [];
  let lsCodeFailed  = await DS.DSGetAllCodeFail();

  let lsBlackList   = [];
  let blackListDS   = await DS.DSGetDataGlobal('admin', 'black_list');
  if (blackListDS !== null && blackListDS !== undefined) {
    lsBlackList = blackListDS['black_list'];
  }

  for (let d of lsCodeFailed) {
    let inBlackList = 0;
    if (chkUserInBlackList(d['mega_id'], lsBlackList)) {
      inBlackList = 1;
    }

    tmp.push({
      mega_code     : d['mega_id'],
      name          : d['name'],
      phone         : d['phone'],
      code          : d['code'],
      time          : convertTimeToString(d['time']),
      milli         : d['time'],
      in_black_list : inBlackList
    });
  }
  tmp.sort((a, b) => { return b['milli'] - a['milli'] });
  return tmp;
}

exports.getSpecialItemsAllUser = (lsAllUser, lsTurnning) => {
  for (let u of lsAllUser) {
    for (let s of u['data_user']['special_item']) {
      let ss          = s.split('_');                          //{id}_{millisecond}
      let itemSpecial = config.SPECIAL_ITEM.find(e => { return e['id'] === parseInt(ss[0], 10) });
      if (itemSpecial !== null && itemSpecial !== undefined) {
        lsTurnning.push({
          mega_code : u['mega_code'],
          name      : u['data_user']['name'],
          phone     : u['data_user']['phone'],
          province  : u['data_user']['province'],
          reward    : itemSpecial['description'],
          time      : convertTimeToString(parseInt(ss[1], 10)),
          milli     : parseInt(ss[1], 10)
        });
      }
    }
  }
  lsTurnning.sort((a, b) => { return b['milli'] - a['milli'] });
  return lsTurnning;
}

exports.getAllLuckyCode = async () => {
  let lsAllDataUser = await this.getAllDataUser();
  let tmp           = [];
  for (let d of lsAllDataUser) {
    for (let m of d['data_user']['lucky_code']) {
      let s     = m.split('_');
      let time  = util.convertTimeToString(parseInt(s[1], 10));                                         //{code}_{new-turn-user}_{bonus-turn}_{timestamp}_{lucky-code}
      
      tmp.push({
        mega_id     : d['mega_code'],
        name        : d['data_user']['name'],
        phone       : d['data_user']['phone'],
        province    : d['data_user']['province'],
        lucky_code  : s[0],
        time        : time
      });
    }
  }
  return tmp;
}

exports.addUserToBlackList = async (megaID) => {
  let blackListDS = await DS.DSGetDataGlobal('admin', 'black_list');
  if (blackListDS === null || blackListDS === undefined) {
    let tmp = [];
    tmp.push({
      mega_code : megaID,
      status    : 1
    });
    DS.DSUpdateDataGlobal('admin', 'black_list', {black_list: tmp});
    return;
  }

  let blFind = blackListDS['black_list'].find(e => { return e['mega_code'] === megaID });
  if (blFind === null || blFind === undefined) {
    blackListDS['black_list'].push({
      mega_code : megaID,
      status    : 1
    });
  }
  else {
    blFind['status'] = 1;
  }
  DS.DSUpdateDataGlobal('admin', 'black_list', blackListDS);
}

exports.delUserInBlackList = async (megaID) => {
  let blackListDS = await DS.DSGetDataGlobal('admin', 'black_list');
  if (blackListDS === null || blackListDS === undefined) {
    return {status: false, msg: 'Failed!'};
  }

  let userFind = blackListDS['black_list'].find(e => { return e['mega_code'] === megaID });
  if (userFind === null || userFind === undefined) {
    return {status: false, msg: 'User not exist!'};
  }

  let index = blackListDS['black_list'].indexOf(userFind);
  blackListDS['black_list'].splice(index, 1);
  DS.DSUpdateDataGlobal('admin', 'black_list', blackListDS);
  return {status: true};
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

function convertTimeToString(milli) {
  let time    = new Date(milli + 7 * 3600 * 1000);
  let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
  let year    = time.getFullYear();
  let hour    = time.getHours() < 10 ? `0${time.getHours()}` : time.getHours();
  let minute  = time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes();
  // let second  = time.getSeconds();
  return `${date}-${month}-${year}  ${hour}:${minute}`;
}

function chkUserInBlackList(megaID, lsBlackList) {
  let tmp = lsBlackList.find(e => { return e['mega_code'] === megaID });
  if (tmp !== null && tmp !== undefined && tmp['status'] === 1) return true;
  return false;
}