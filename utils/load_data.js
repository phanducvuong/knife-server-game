const FS              = require('../repository/firestore');
const redisClient     = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

exports.loadDataGlobal = async () => {
  //partitions
  const partitions = await FS.FSGetPartition();
  if (partitions === null || partitions === undefined) return false;
  config.PARTITIONS.distane_ani_board = partitions.distane_ani_board;
  config.PARTITIONS.dura_ani_board    = partitions.dura_ani_board;
  config.PARTITIONS.dura_knife_fly    = partitions.dura_knife_fly;
  config.PARTITIONS.partition         = partitions.partition;
  config.PARTITIONS.veloc             = partitions.veloc;
  
  config.PARTITIONS.data              = [];
  config.PARTITIONS.data.push(...partitions.data);

  //array item
  const arrItem = await FS.FSGetAllItem();
  if (arrItem === null || arrItem === undefined || arrItem.length <= 0) return false;
  config.ARR_ITEM.push(...arrItem);

  return true;
}