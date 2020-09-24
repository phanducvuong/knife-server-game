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
  setInterval(async () => {
    await this.updatePartition();
  }, 6000000);
}

exports.updatePartition = async () => {
  //update partition
  // let partitions = await FS.FSGetPartition();
  // if (partitions !== null && partitions !== undefined) {
  //   config.PARTITIONS['distane_ani_board']  = partitions['distane_ani_board'];
  //   config.PARTITIONS['dura_ani_board']     = partitions['dura_ani_board'];
  //   config.PARTITIONS['dura_knife_fly']     = partitions['dura_knife_fly'];
  //   config.PARTITIONS['partition']          = partitions['partition'];
  //   config.PARTITIONS['veloc']              = partitions['veloc'];
  //   config.PARTITIONS['data']               = partitions['data'];
  // }

  // let lsSupportingItem = await FS.FSGetSupportItem();
  // if (lsSupportingItem !== null && lsSupportingItem !== undefined) {
  //   config.SUPPORTING_ITEM = [];
  //   config.SUPPORTING_ITEM.push(...lsSupportingItem);
  // }

  // let arrItem = await FS.FSGetAllItem();
  // if (arrItem !== null && arrItem !== undefined) {
  //   config.ARR_ITEM = [];
  //   config.ARR_ITEM.push(...arrItem);

  //   filterItemHaveInListPartition(config.PARTITIONS['data'], config.ARR_ITEM);
  // }
}

function filterItemHaveInListPartition(lsPartition, lsItem) {
  config.ITEM_FILTER    = [];
  config.TOTAL_PERCENT  = 0;

  for (let par of lsPartition) {
    let tmp = config.ITEM_FILTER.find(e => { return e['id'] === par['id'] });
    if (tmp === null || tmp === undefined) {
      let item = lsItem.find(ee => { return ee['id'] === par['id'] });
      if (item !== null && item !== undefined) {
        config.ITEM_FILTER.push(item);
        config.TOTAL_PERCENT += item['percent'];
      }
    }
  }
}