const {Datastore}     = require('@google-cloud/datastore');

const dbClient        = new Datastore();

//-----------------------------------admin--------------------------------
exports.DSUpdateDataGlobal = (kind, key, data) => {
  try {
    let keyEntity = dbClient.key([`${kind}`, `${key}`]);
    dbClient.save({
      key     : keyEntity,
      data    : data
    });
  }
  catch(err) {
    console.log(err);
  }
}

exports.DSGetDataGlobal = async (kind, key) => {
  try {
    let keyEntity = dbClient.key([`${kind}`, `${key}`]);
    let [result]  = await dbClient.get(keyEntity);

    if (result === null || result === undefined) return null;
    return result;
  }
  catch(err) {
    console.log(err);
    return null;
  }
}

exports.DSGetAllItem = async () => {
  try {
    let query     = dbClient.createQuery('items');
    let [result]  = await dbClient.runQuery(query);
    return result;
  }
  catch(err) {
    console.log(err);
    return [];
  }
}

exports.DSDeleteItemBy = (kind, key) => {
  try {
    let keyEntity = dbClient.key([`${kind}`, `${key}`]);
    dbClient.delete(keyEntity);
  }
  catch(err) {
    console.log(err);
  }
}

exports.DSIncreaseAmountItem = async (id) => {
  try {
    let result = await this.DSGetDataGlobal('items', id);
    if (result !== null && result !== undefined) {
      result.amount += 1;
      this.DSUpdateDataGlobal('items', id, result);
    }
  }
  catch(err) {
    console.log(err);
  }
}

//----------------------------------------data user------------------------------------
exports.DSGetDataUser = (kind, key) => {
  return new Promise((resv, rej) => {
    let keyEntity = dbClient.key([`${kind}`, `${key}`]);
    dbClient.get(keyEntity)
            .then(([result]) => {
              if (result === null || result === undefined) {
                return resv(null);
              }
              return resv(result);
            })
            .catch((err) => { return rej('Get User Failed!') });
  });
}

exports.DSUpdateDataUser = (kind, key, data) => {
  try {
    if (kind === null || kind === undefined) throw `kind is undefined ${kind}`;
    let keyEntity = dbClient.key([`${kind}`, `${key}`]);
    dbClient.save({
      key     : keyEntity,
      data    : data
    });
  }
  catch(err) {
    console.log(err);
  }
}

exports.DSUpdateHistoryUser = async (kind, strHis) => {
  try {
    let keyEntity = dbClient.key([`${kind}`, 'histories']);
    let [result]  = await dbClient.get(keyEntity);

    if (result === null || result === undefined) {
      let data = {
        history : [strHis]
      }
      dbClient.save({
        key     : keyEntity,
        data    : data
      });
      return;
    }

    result.history.push(strHis);
    dbClient.save({
      key     : keyEntity,
      data    : result
    });
  }
  catch(err) {
    console.log(err);
  }
}

exports.DSGetAllUser = async () => {
  try {
    const query       = dbClient.createQuery('__kind__').select('__key__');
    const [entities]  = await dbClient.runQuery(query);

    let arrKind       = [];
    for (let e of entities) {
      if (e[dbClient.KEY].name.includes('MEGA')) {
        arrKind.push(e[dbClient.KEY].name);
      }
    }
    return arrKind;
  }
  catch(err) {
    console.log(err);
    return [];
  }
}

exports.DSUpdateUniqueUser = async (mega_code, millisecond) => {
  const transaction = dbClient.transaction();
  try {
    const key         = dbClient.key(['statistical', 'unique_user']);
    await transaction.run();

    const [result] = await transaction.get(key);
    if (result === null || result === undefined || result['unique_user'] === null || result['unique_user'] === undefined) {
      let arrUnique = [`${mega_code}_${millisecond}`];
      transaction.save({
        key   : key,
        data  : { unique_user: arrUnique }
      });
      await transaction.commit();
      return;
    }
    
    if (!chkMegaCodeExistIn(mega_code, result['unique_user'])) {
      result['unique_user'].push(`${mega_code}_${millisecond}`);
      transaction.save({
        key   : key,
        data  : { unique_user: result['unique_user'] }
      });
      await transaction.commit();
    }
  }
  catch(err) {
    console.log(err);
    let result = await transaction.rollback();
    console.log(result);
  }
}

exports.DSUpdateNewbieUser = async (data) => {
  const transaction = dbClient.transaction();
  try {
    const key = dbClient.key(['statistical', 'newbie']);
    await transaction.run();

    let [result] = await transaction.get(key);
    if (result === null || result === undefined || result['newbie'] === null || result['newbie'] === undefined) {
      let arrData = {
        newbie  : [data]
      };
      transaction.save({
        key   : key,
        data  : arrData
      });
      await transaction.commit();
      return;
    }

    result['newbie'].push(data);
    transaction.save({
      key   : key,
      data  : { newbie: result['newbie'] }
    });
    await transaction.commit();
  }
  catch(err) {
    await transaction.rollback();
  }
}

//---------------------------------------------------functional---------------------------------
function chkMegaCodeExistIn(mega_code, lsUnique) {
  let result = lsUnique.find(e => { return e.includes(mega_code) });
  if (result === null || result === undefined) return false;
  return true;
}