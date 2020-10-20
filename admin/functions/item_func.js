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
    if (i['type'] === 0 || i['type'] === 1) {
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

  let details = [];                                          //list detail history user. Dùng để xuất log
  for (let u of lsHisAllUser) {
    let tmpArr  = [];
    for (let his of u['histories']) {
      let json    = JSON.parse(his);
      let milli   = json['time'] + 7 * 3600 * 1000;
      if (idItem === json['id_item'] && util.chkTheSameDate(millisecond, milli)) {
        total += 1;
        tmpArr.push(json)
      }
    }

    if (tmpArr.length > 0) {
      details.push({
        mega_code : u['mega_code'],
        data      : tmpArr
      });
    }
  }
  return {
    status  : true,
    item    : item,
    total   : total,
    details : details
  };
}