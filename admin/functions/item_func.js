const DS              = require('../../repository/datastore');
const dashboardFunc   = require('./dashboard_func');
const util            = require('../../utils/util');

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

  for (let u of lsHisAllUser) {
    for (let his of u['histories']) {
      let json  = JSON.parse(his);
      let milli = json['time'] + 7 * 3600 * 1000;
      if (idItem === json['id_item'] && util.chkTheSameDate(millisecond, milli)) {
        total += 1;
      }
    }
  }
  return total;
}