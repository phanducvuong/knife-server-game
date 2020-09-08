const redisClient     = require('redis');
const { hashCode }        = require('../utils/hash_code');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_pro');
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

//-----------------------------------------data global----------------------------------------------
exports.updatePartition = (data) => {
  const index = getIndex('partition');
  insLsRedis[index].set('partition', data);
}

//-----------------------------------------functional-----------------------------------------------
function getIndex(key) {
  let index = Math.abs(hashCode(key)) % config.LENGTH_REDIS;
  return index;
}