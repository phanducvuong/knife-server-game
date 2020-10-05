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
    host  : ele.host
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
      if (err) return rej('can not get data user');
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
  let index   = getIndex('notifica_banner');
  insLsRedis[index].rpush('notifica_banner', data);
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

//-----------------------------------------functional-----------------------------------------------
function getIndex(key) {
  let index = Math.abs(hashCode(key)) % config.LENGTH_REDIS;
  return index;
}