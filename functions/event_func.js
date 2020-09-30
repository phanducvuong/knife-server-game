var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.lsEventWithSpItem = () => {
  let lsEvent = [];
  for (let e of config.EVENTS.data) {
    if (e['id_sp_item'] !== null) {
      let tmpSp = config.SUPPORTING_ITEM.find(ee => { return ee['id'] === e['id_sp_item'] });
      if (tmpSp !== null && tmpSp !== undefined) {
        lsEvent.push({
          id          : e['id'],
          description : e['description'],
          free        : false,
          sp_item     : tmpSp
        });
      }
    }
    else {
      lsEvent.push({
        id          : e['id'],
        description : e['description'],
        free        : true,
        bonus       : e['bonus']
      });
    }
  }
  return lsEvent;
}

exports.joinEvent = (dataUser, idEvent) => {
  let tmpEvent = config.EVENTS.data.find(e => { return e['id'] === idEvent });
  if (tmpEvent === null || tmpEvent === undefined) {
    return {
      status  : false,
      msg     : 'Can not get tmpEvent'
    };
  }

  if (tmpEvent['id_sp_item'] !== null) {
    let tmpSpItem = config.SUPPORTING_ITEM.find(e => { return e['id'] === tmpEvent['id_sp_item'] });
    if (tmpSpItem === null || tmpSpItem === undefined) {
      return {
        status  : false,
        msg     : 'Can not get supporting item'
      };
    }

    for (let i=0; i<dataUser['sp_item'].length; i++) {
      let tmpSp   = dataUser['sp_item'][i].split('_');
      let id      = parseInt(tmpSp[0], 10);
      let amount  = parseInt(tmpSp[1], 10);
      if (isNaN(id) === false && isNaN(amount) === false && id === tmpSpItem['id']) {
        amount                += tmpSpItem['bonus'];
        dataUser['sp_item'][i] = `${id}_${amount}`;
        return {
          status          : true,
          dataUserUpdate  : dataUser,
          bonus           : tmpSpItem['bonus'],
          description     : tmpSpItem['description'],
          free            : false
        };
      }
    }

    let strSpItem = `${tmpSpItem['id']}_${tmpSpItem['bonus']}`;
    dataUser['sp_item'].push(strSpItem);
    return {
      status          : true,
      dataUserUpdate  : dataUser,
      bonus           : tmpSpItem['bonus'],
      description     : tmpSpItem['description'],
      free            : false
    }
  }
  else {
    dataUser['turn'] += tmpEvent['bonus'];
    return {
      status          : true,
      dataUserUpdate  : dataUser,
      bonus           : tmpEvent['bonus'],
      description     : tmpEvent['description'],
      free            : true
    };
  }
}