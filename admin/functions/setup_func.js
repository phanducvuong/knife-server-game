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