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
    if (!lsMissionUser.includes(m['id']) && m['status'] === 1) {

      if (m['id_sp_item'] !== null) {
        let tmpSpItem = config.SUPPORTING_ITEM.find(e => { return e['id'] === m['id_sp_item'] });
        if (tmpSpItem !== null && tmpSpItem !== undefined) {
          filter.push({
            id          : m['id'],
            description : m['description'],
            free        : false,
            sp_item     : tmpSpItem
          });
        }
      }
      else {
        filter.push({
          id          : m['id'],
          description : m['description'],
          free        : true,
          bonus       : m['bonus']
        });
      }
    }

  }
  return filter;
}

exports.getBonusFromMission = (idMission, dataUser) => {
  if (dataUser['mission'].includes(idMission)) {
    return {
      status  : false,
      msg     : 'Mission completed!'
    }
  } //check mission user have completed

  let tmpMission = config.MISSIONS.find(e => { return e['id'] === idMission && e['status'] === 1 });
  if (tmpMission === null || tmpMission === undefined) {
    return {
      status  : false,
      msg     : 'Mission is not exist!'
    };
  } //mission is not exist

  if (tmpMission['id_sp_item'] !== null) {
    let tmpSpItem = config.SUPPORTING_ITEM.find(e => { return e['id'] === tmpMission['id_sp_item'] });
    if (tmpSpItem === null || tmpSpItem === undefined) {
      return {
        status  : false,
        msg     : 'Support item is not exist!'
      }
    }

    //check list sp_item user have tmpSpItem or not
    for (let i=0; i<dataUser['sp_item'].length; i++) {
      let tmpSp   = dataUser['sp_item'][i].split('_');
      let id      = parseInt(tmpSp[0], 10);
      let amount  = parseInt(tmpSp[1], 10);
      if (isNaN(id) === false && isNaN(amount) === false && id === tmpSpItem['id']) {
        amount                += tmpSpItem['bonus'];
        dataUser['sp_item'][i] = `${id}_${amount}`;
        dataUser['mission'].push(tmpMission['id']);
        return {
          status          : true,
          dataUserUpdate  : dataUser,
          bonus           : tmpSpItem['bonus'],
          description     : tmpSpItem['description']
        };
      }
    }

    let strSpItem = `${tmpSpItem['id']}_${tmpSpItem['bonus']}`;
    dataUser['sp_item'].push(strSpItem);
    dataUser['mission'].push(tmpMission['id']);
    return {
      status          : true,
      dataUserUpdate  : dataUser,
      bonus           : tmpSpItem['bonus'],
      description     : tmpSpItem['description']
    }
  } //mission is not free
  else {
    dataUser['mission'].push(tmpMission['id']);
    dataUser['turn'] += tmpMission['bonus'];
    return {
      status          : true,
      dataUserUpdate  : dataUser,
      bonus           : tmpMission['bonus'],
      description     : tmpMission['description']
    }
  } //mission is free
}