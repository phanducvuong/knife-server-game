exports.idExistIn = (lsItem, idChk) => {
  for (e of lsItem) {
    if (idChk === e['id']) {
      return true;
    }
  }
  return false;
}

exports.deleteItemBy = (lsItem, idDel) => {
  for (let i=0; i<lsItem.length; i++) {
    if (lsItem[i]['id'] === idDel) {
      lsItem.splice(i, 1);
      return {
        status        : true,
        lsItemUpdate  : lsItem
      };
    }
  }
  return {
    status  : false
  };
}

exports.deletePartitionBy = (lsPartition, posDel) => {
  for (let i=0; i<lsPartition.length; i++) {
    if (lsPartition[i]['pos'] === posDel) {
      lsPartition.splice(i, 1);
      return {
        status              : true,
        lsPartitionUpdate   : lsPartition
      };
    }
  }
  return {
    status  : false
  };
}

exports.findItemAndIndex = (lsItem, idChk) => {
  for (let i=0; i<lsItem.length; i++) {
    if (lsItem[i]['id'] === idChk) {
      return {
        item  : lsItem[i],
        index : i
      }
    }
  }
  return null;
}

exports.findPartitionAndIndex = (lsPartition, pos) => {
  for (let i=0; i<lsPartition.length; i++) {
    if (lsPartition[i]['pos'] === pos) {
      return {
        item  : lsPartition[i],
        index : i
      }
    }
  }
  return null;
}

exports.posIsExistInLsRegion = (lsRegion, pos) => {
  for (let e of lsRegion) {
    if (e['pos'] === pos) {
      return true;
    }
  }
  return false;
}

exports.chkItemExistInPartition = (lsPartition, idItem) => {
  if (lsPartition === null || lsPartition === undefined || lsPartition.length <= 0) return false;
  for (let e of lsPartition) {
    if (e['id'] === idItem) {
      return true;
    }
  }
  return false;
}

//lọc list mission với list item vật phẩm trả về cho admin
exports.filterLsMission = (lsMission, lsSupportItem) => {
  let filters = [];
  for (m of lsMission) {
    if (m['id_sp_item'] !== null) {
      let tmpSpItem = lsSupportItem.find(e => { return e['id'] === m['id_sp_item'] });
      if (tmpSpItem !== null && tmpSpItem !== undefined) {
        let tmp = {
          id          : m['id'],
          description : m['description'],
          id_sp_item  : tmpSpItem['id'],
          sp_item     : tmpSpItem,
          status      : m['status']
        }
        filters.push(tmp);
      } //vật phẩm có tồn tại trong mission
      else {
        filters.push(m);
      } //không tìm thấy id vật phẩm trong mission
    }
    else {
      filters.push(m);
    }
  }
  return filters;
}

exports.filterLsEvent = (lsEvent, lsSupportingItem) => {
  let filter = [];
  for (let e of lsEvent) {
    if (e['id_sp_item'] !== null) {
      let tmp = lsSupportingItem.find(ee => { return ee['id'] === e['id_sp_item'] });
      if (tmp !== null && tmp !== undefined) {
        filter.push({
          id          : e['id'],
          description : e['description'],
          bonus       : e['bonus'],
          sp_item     : tmp['description'],
          status      : e['status']
        });
      }
    }
    else {
      filter.push({
        id          : e['id'],
        description : e['description'],
        bonus       : e['bonus'],
        sp_item     : 'NONE',
        status      : e['status']
      });
    }
  }

  return filter;
}

exports.findEventById = (idEvent, lsEvent, lsSupportItem) => {
  let eventFind = lsEvent.find(e => { return e['id'] === idEvent });
  if (eventFind === null || eventFind === undefined) {
    return {
      status  : false,
      msg     : 'Can not get event by id'
    }
  }

  if (eventFind['id_sp_item'] !== null) {
    let tmp = lsSupportItem.find(e => { return e['id'] === eventFind['id'] });
    if (tmp === null || tmp === undefined) {
      return {
        status  : false,
        msg     : 'Can not get sp item by id'
      }
    }
    return {
      status    : true,
      eventById : {
        id          : eventFind['id'],
        description : eventFind['description'],
        bonus       : eventFind['bonus'],
        sp_item     : tmp['description'],
        status      : eventFind['status']
      }
    }
  }

  return {
    status    : true,
    eventById : {
      id          : eventFind['id'],
      description : eventFind['description'],
      bonus       : eventFind['bonus'],
      sp_item     : null,
      status      : eventFind['status']
    }
  }
}

exports.deleteMissionByID = (lsMission, idMission) => {
  for (let i=0; i<lsMission.length; i++) {
    if (lsMission[i]['id'] === idMission) {
      lsMission.splice(i, 1);
      return {
        status        : true,
        missionUpdate : lsMission
      }
    }
  }
  return {
    status  : false,
    msg     : '2. Delete missions failed!'
  }
}

exports.deleteEventByID = (events, idEvent) => {
  for (let i=0; i<events['data'].length; i++) {
    if (events['data'][i]['id'] === idEvent) {
      events['data'].splice(i, 1);
      return {
        status        : true,
        eventUpdate   : events
      }
    }
  }
  return {
    status  : false,
    msg     : '2. Delete events failed!'
  }
}

exports.addNewUserIntoBlackList = (lsBlackList, lsMegaID) => {
  for (let megaID of lsMegaID) {
    let tmp = lsBlackList.find(e => { return e['mega_code'] === megaID.trim() });
    if (tmp === null || tmp === undefined) {
      lsBlackList.push({
        mega_code : megaID.trim(),
        status    : 1
      });
    }
  }
  return lsBlackList;
}