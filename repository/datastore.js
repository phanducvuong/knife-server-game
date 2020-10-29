const {Datastore}     = require('@google-cloud/datastore');
const util            = require('../utils/util');

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

exports.DSTestSaveData = async (data) => {
  try {
    let keyEntity = dbClient.key([`abc`, `abc`]);
    let result    = await dbClient.save({
      key     : keyEntity,
      data    : data
    });
    return result;
  }
  catch(err) {
    return err;
  }
}