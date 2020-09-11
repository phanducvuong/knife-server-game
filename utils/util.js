exports.chkUserInBlackList = (megaID, blackList) => {
  for (e of blackList) {
    if (e === megaID) {
      return true;
    }
  }
  return false;
}