const DS              = require('../repository/datastore');
const cron            = require('node-cron');
const redisClient     = require('../redis/redis_client');
const util            = require('./util');
const profileFunc     = require('../functions/profile_user_func');

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
  }, 60000);
}

exports.scheResetDataUser = async () => {
  cron.schedule('59 59 16 * * *', async () => {

    try {
      redisClient.clearLsNotificaBanner();
      await resetAmountItem();
      await resetDataUser();
    }
    catch(err) {
      console.log(err);
    }

  });
}

exports.updatePartition = async () => {
  //update partition
  let partitions = await DS.DSGetDataGlobal('admin', 'partitions');
  if (partitions !== null && partitions !== undefined) {
    config.PARTITIONS['distane_ani_board']  = partitions['distane_ani_board'];
    config.PARTITIONS['dura_ani_board']     = partitions['dura_ani_board'];
    config.PARTITIONS['dura_knife_fly']     = partitions['dura_knife_fly'];
    config.PARTITIONS['partition']          = partitions['partition'];
    config.PARTITIONS['veloc']              = partitions['veloc'];
    config.PARTITIONS['data']               = partitions['data'];
  }

  //update supporting item
  let supportingItem = await DS.DSGetDataGlobal('admin', 'supporting_item');
  if (supportingItem !== null && supportingItem !== undefined) {
    config.SUPPORTING_ITEM = [];
    config.SUPPORTING_ITEM.push(...supportingItem['supporting_item']);
  }

  //update array item
  let arrItem = await DS.DSGetAllItem();
  if (arrItem !== null && arrItem !== undefined) {
    config.ARR_ITEM = [];
    config.ARR_ITEM.push(...arrItem);

    filterItemHaveInListPartition(config.PARTITIONS['data'], config.ARR_ITEM);
  }

  //update mission
  let missions = await DS.DSGetDataGlobal('admin', 'missions');
  if (missions !== null && missions !== undefined) {
    config.MISSIONS = [];
    config.MISSIONS.push(...missions['missions']);
  }

  //update event
  let events = await DS.DSGetDataGlobal('admin', 'events');
  if (events !== null && events !== undefined) {
    config.EVENTS.start = events['start'];
    config.EVENTS.end   = events['end'];
    config.EVENTS.data  = [];
    config.EVENTS.data.push(...events['data']);
  }

  //update black list
  let blackList = await DS.DSGetDataGlobal('admin', 'black_list');
  if (blackList !== null && blackList !== undefined) {
    config.BLACK_LIST = [];
    config.BLACK_LIST.push(...blackList['black_list']);
  }

  //update countdown
  let countDown = await DS.DSGetDataGlobal('admin', 'count_down');
  if (countDown !== null && countDown !== undefined) {
    config.COUNT_DOWN = countDown['count_down'];
  }

  // update bonus enter code
  let bonusEnterCode = await DS.DSGetDataGlobal('admin', 'bonus_enter_code');
  if (bonusEnterCode !== null && bonusEnterCode !== undefined) {
    config.BONUS_ENTER_CODE = bonusEnterCode;
  }

  // update text show
  let textShow = await DS.DSGetDataGlobal('admin', 'text_show');
  if (textShow !== null && textShow !== undefined) {
    config.TEXT_SHOW = textShow;
  }

  //update rule_block_acc
  let ruleBlockAcc = await DS.DSGetDataGlobal('admin', 'rule_block_acc');
  if (ruleBlockAcc !== null && ruleBlockAcc !== undefined) {
    config.RULE_BLOCK_ACC = [];
    config.RULE_BLOCK_ACC.push(...ruleBlockAcc['rule_block_acc']);
  }
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

async function resetDataUser() {
  let lsMegaIDUser = await DS.DSGetAllUser();
  for (let u of lsMegaIDUser) {
    let dataUser = await DS.DSGetDataUser(u, 'turn_inven');
    if (dataUser !== null && dataUser !== undefined) {
      dataUser['actions'][0] = 0;
      dataUser['actions'][1] = 0;

      if (!util.chkTimeEvent(config.EVENTS.start, config.EVENTS.end)) {
        dataUser['events'][0] = 0;
        dataUser['events'][1] = 0;
        dataUser['events'][2] = 0;
        dataUser['events'][3] = 0;
        dataUser['event_did'] = [];
      }

      if (profileFunc.isBlockAcc(dataUser['block_acc'])['status'] === false) {
        dataUser['block_acc'] = profileFunc.resetBlockAccUser(dataUser['block_acc']);
      } //reset block acc user if user isn't blocked

      DS.DSUpdateDataUser(u, 'turn_inven', dataUser);
      redisClient.updateTurnAndInvenUser(u, JSON.stringify(dataUser));
    }
  }
}

async function resetAmountItem() {
  let arrItem = await DS.DSGetAllItem();
  if (arrItem !== null && arrItem !== undefined) {
    for (let e of arrItem) {
      e['amount'] = 0;
      redisClient.delKeyItem(e['id']);
      DS.DSUpdateDataGlobal('items', e['id'], e);
    }
    config.ARR_ITEM = [];
    config.ARR_ITEM.push(...arrItem);
    filterItemHaveInListPartition(config.PARTITIONS['data'], config.ARR_ITEM);
  }
}