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