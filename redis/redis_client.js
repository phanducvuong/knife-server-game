const utils           = require('../utils/util');
const redisClient     = require('redis');
const { hashCode }    = require('../utils/hash_code');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

var insLsRedis      = [];
var lsRedis         = config.initLsRedis();
for (let ele of lsRedis) {
  let tmpRedisClient = redisClient.createClient({
    port  : ele.port,
    host  : ele.host,
    db    : ele.db
  });
  insLsRedis.push(tmpRedisClient);
}

insLsRedis[0].on('connect', () => {
  console.log('you are connect now');
});

//-----------------------------------------data user------------------------------------------------
exports.getTurnAndInvenUser = (mega_code) => {
  return new Promise((resv, rej) => {
    const index = getIndex(mega_code);
    const key   = `${mega_code}_turn_inven`;
    insLsRedis[index].get(key, (err, reply) => {
      if (err) return rej('Can not get data user');
      return resv(reply);
    });
  });
}

exports.updateTurnAndInvenUser = (mega_code, data) => {
  const index = getIndex(mega_code);
  const key   = `${mega_code}_turn_inven`;
  insLsRedis[index].set(key, data);
}

exports.updateHistoryUser = (mega_code, data) => {
  const index = getIndex(mega_code);
  const key   = `${mega_code}_his`;
  insLsRedis[index].rpush(key, data);
}

exports.getHistoryUser = (mega_code) => {
  return new Promise((resv, rej) => {
    let index = getIndex(mega_code);
    insLsRedis[index].lrange(`${mega_code}_his`, 0, -1, (err, reply) => {
      if (err) return rej('Can not get history user!');
      if (reply === null || reply === undefined || reply.length <= 0) return resv([]);
      return resv(reply);
    });
  });
}

//-----------------------------------------data global----------------------------------------------
exports.updatePartition = (data) => {
  const index = getIndex('partition');
  insLsRedis[index].set('partition', data);
}

exports.getPartition = () => {
  return new Promise((resv, rej) => {
    const index = getIndex('partition');
    insLsRedis[index].get('partition', (err, reply) => {
      if (err) return rej(err);
      return resv(reply);
    });
  });
}

exports.delKeyItem = (key) => {
  const index = parseInt(key, 10) % config.LENGTH_REDIS;
  insLsRedis[index].del(`${key}`);
}

exports.updateArrItem = (data) => {
  const index = getIndex('items');
  insLsRedis[index].set('items', data);
}

exports.initItemBy = (key) => {
  const index = parseInt(key, 10) % config.LENGTH_REDIS;
  insLsRedis[index].set(`${key}`, 0);
}

exports.updateAmountItemBy = (key, amount) => {
  const index = parseInt(key, 10) % config.LENGTH_REDIS;
  insLsRedis[index].set(`${key}`, amount);
}

exports.incrItemBy = (key) => {
  const index = parseInt(key, 10) % config.LENGTH_REDIS;
  insLsRedis[index].incr(`${key}`);
}

exports.incrByItemBy = (key, amount) => {
  const index = parseInt(key, 10) % config.LENGTH_REDIS;
  insLsRedis[index].incrby(`${key}`, amount);
}

exports.getAmountItem = (key) => {
  return new Promise((resv, rej) => {
    const index = parseInt(key, 10) % config.LENGTH_REDIS;
    insLsRedis[index].get(`${key}`, (err, reply) => {
      if (err) return rej('can not get amount item');
      return resv(parseInt(reply, 10));
    });
  });
}

exports.getArrItem = () => {
  return new Promise((resv, rej) => {
    const index = getIndex('items');
    insLsRedis[index].get('items', (err, reply) => {
      if (err) return rej('can not get items in redis');
      return resv(reply);
    });
  });
}

exports.addNotificaBanner = (data) => {
  let index = getIndex('notifica_banner');
  insLsRedis[index].rpush('notifica_banner', data);
}

exports.clearLsNotificaBanner = () => {
  let index = getIndex('notifica_banner');
  insLsRedis[index].del('notifica_banner');
}

exports.getNotificaBanner = () => {
  return new Promise((resv, rej) => {
    let index   = getIndex('notifica_banner');
    insLsRedis[index].lrange('notifica_banner', 0, -1, (err, reply) => {
      if (err || reply === null) return resv([]);
      return resv(reply);
    });
  });
}

exports.flushall = () => {
  for (let i=0; i<insLsRedis.length; i++) {
    insLsRedis[i].flushall();
  }
}

//-----------------------------------------admin tool---------------------------------------------------------
exports.getAllKeyBy = (key) => {
  return new Promise((resv, rej) => {
    let lsAllMegaID = [];
    for (let i=0; i<config.LENGTH_REDIS; i++) {
      insLsRedis[i].keys(`*${key}*`, (err, rep) => {
        if (rep !== null && rep !== undefined && rep.length > 0)
          lsAllMegaID.push(...rep);

        if (i === config.LENGTH_REDIS-1) {
          let uniqueArr = utils.getUniqueArr(lsAllMegaID);
          return resv(uniqueArr);
        }
      });
    }
  });
}

//-----------------------------------------functional---------------------------------------------------------
function getIndex(key) {
  let index = Math.abs(hashCode(key)) % config.LENGTH_REDIS;
  return index;
}