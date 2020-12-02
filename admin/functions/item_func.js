const DS              = require('../../repository/datastore');
const dashboardFunc   = require('./dashboard_func');
const util            = require('../../utils/util');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

exports.filterOptionItem = async () => {
  let lsAllItem = await DS.DSGetAllItem();
  let filter    = [];
  for (let i of lsAllItem) {
    if (i['type'] !== -1) {
      filter.push({
        id    : i['id'],
        name  : i['name']
      });
    }
  }
  return filter;
}

exports.getTotalAmountItemBy = async (idItem, millisecond) => {
  let total         = 0;
  let lsAllMegaID   = await DS.DSGetAllUser();
  let lsHisAllUser  = await dashboardFunc.getHistoryAllUser(lsAllMegaID);
  let itemFind      = config.ARR_ITEM.find(e => { return e['id'] === idItem });

  if (itemFind === null || itemFind === undefined) {
    return { status: false };
  }

  let item = {
    id      : itemFind['id'],
    name    : itemFind['name'],
    type    : itemFind['type']
  }

  if (itemFind['type'] === 2) {
    let lsAllDataUser = await dashboardFunc.getAllDataUser(lsAllMegaID);
    for (let d of lsAllDataUser) {
      for (let l of d['data_user']['lucky_code']) {
        let split = l.split('_');                                           //{code}_{millisecond}
        let milli = parseInt(split[1], 10) + 7 * 3600 * 1000;
        if (util.chkTheSameDate(millisecond, milli)) {
          total += 1;
        }
      }
    }
  } //get total lucky_code is created by date
  else {
    for (let u of lsHisAllUser) {
      for (let his of u['histories']) {
        let json    = JSON.parse(his);
        let milli   = json['time'] + 7 * 3600 * 1000;
        if (idItem === json['id_item'] && util.chkTheSameDate(millisecond, milli)) {
          total += 1;
        }
      }
    }
  }

  return {
    status  : true,
    item    : item,
    total   : total,
  };
}

exports.getListItemSpecialUser = (lsSpecialItem) => {
  let tmp = [];
  for (let s of lsSpecialItem) {
    let ss              = s.split('_');                                                           //{id_special_item}_{millisecond}
    let specialItemFind = config.SPECIAL_ITEM.find(e => { return e['id'] === parseInt(ss[0]) });
    if (specialItemFind !== null && specialItemFind !== undefined) {
      tmp.push({
        id          : specialItemFind['id'],
        description : specialItemFind['description'],
        millisecond : ss[1],
        time        : util.convertTimeToString(parseInt(ss[1], 10))
      });
    }
  }
  return tmp;
}

exports.delSpecialItemUser = (lsSpecialItem, condition) => {
  let specialItemFind = lsSpecialItem.find(e => { return e === condition });
  if (specialItemFind === null || specialItemFind === undefined) {
    return { status: false };
  }

  let index = lsSpecialItem.indexOf(specialItemFind);
  lsSpecialItem.splice(index, 1);
  return {
    status                  : true,
    ls_special_item_update  : lsSpecialItem
  };
}