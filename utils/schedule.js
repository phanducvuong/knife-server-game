const FS              = require('../repository/firestore');
const redisClient     = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.scheDataGlobal = () => {
  setInterval(() => {
    updatePartition();
  }, 3000);
}

async function updatePartition() {
  //update partition
  let partitions = JSON.parse(await redisClient.getPartition());
  if (partitions !== null && partitions !== undefined) {
    config.PARTITIONS['distane_ani_board']  = partitions['distane_ani_board'];
    config.PARTITIONS['dura_ani_board']     = partitions['dura_ani_board'];
    config.PARTITIONS['dura_knife_fly']     = partitions['dura_knife_fly'];
    config.PARTITIONS['partition']          = partitions['partition'];
    config.PARTITIONS['veloc']              = partitions['veloc'];
    config.PARTITIONS['data']               = partitions['data'];
  }
}