const FS                = require('../../repository/firestore');
const DS                = require('../../repository/datastore');
const redisClient       = require('../../redis/redis_client');
const setupFunc         = require('../functions/setup_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

const setupRoute = async (app, opt) => {

  //setup partition
  app.post('/update-board', async (req, rep) => {
    try {

      let partition     = parseInt(req.body.partition, 10);
      let veloc         = parseInt(req.body.veloc, 10);
      let duraKnifeFly  = parseFloat(req.body.dura_knife_fly, 10);
      let duraInimBoard = parseFloat(req.body.dura_ani_board, 10);
      let disAnimBoard  = parseInt(req.body.distane_ani_board, 10);

      if (isNaN(partition) || isNaN(veloc) || isNaN(duraKnifeFly) || isNaN(duraInimBoard) || isNaN(disAnimBoard)) {
        throw 'Check info board!';
      }

      let partitions = await FS.FSGetPartition();
      if (partitions === null || partitions === undefined) {
        let tmpPartition = {
          partition           : partition,
          veloc               : veloc,
          dura_knife_fly      : duraKnifeFly,
          dura_ani_board      : duraInimBoard,
          distane_ani_board   : disAnimBoard,
          data                : []
        }

        FS.FSUpdatePartition(tmpPartition);
        redisClient.updatePartition(JSON.stringify(tmpPartition));

        rep.send({
          status_code : 2000
        });

        return;
      }

      partitions['partition']         = partition;
      partitions['veloc']             = veloc;
      partitions['dura_knife_fly']    = duraKnifeFly;
      partitions['dura_ani_board']    = duraInimBoard;
      partitions['distane_ani_board'] = disAnimBoard;

      FS.FSUpdatePartition(partitions);
      redisClient.updatePartition(JSON.stringify(partitions));

      rep.send({
        status_code : 2000
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.get('/get-config-partition', async (req, rep) => {
    try {

      let dataPartition = await DS.DSGetDataGlobal('admin', 'partitions');
      if (dataPartition === null || dataPartition === undefined) {
        dataPartition = {
          distane_ani_board : 0,
          dura_ani_board    : 0,
          dura_knife_fly    : 0,
          partition         : 0,
          veloc             : 0,
          data              : []
        }
      }

      rep.view('/partials/config_partition_view.ejs', {
        data  : dataPartition
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/add-partition', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let name    = req.body.name.toString().trim();
      let region  = req.body.region.toString().trim();
      let pos     = parseInt(req.body.pos, 10);

      if (isNaN(id) || isNaN(pos) || name === null || name === undefined || name === '' ||
          region === null || region === undefined  || region === '') {
        throw `Add failed!\nCheck info partition!`;
      }

      let [partitions, items] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'partitions'),
        DS.DSGetAllItem()
      ]);

      if (items         === null  || items                           === undefined       ||
          items.length  <= 0      || setupFunc.idExistIn(items, id)  === false) {
        throw `${id} is not exist in list item!`;
      }

      if (partitions === null || partitions === undefined) {
        let data = [];
        data.push({
          id      : id,
          region  : region,
          name    : name,
          pos     : pos
        });

        partitions = {
          distane_ani_board : 50,
          dura_ani_board    : 0.1,
          dura_knife_fly    : 0.1,
          partition         : 12,
          veloc             : 3000,
          data              : data
        }

        DS.DSUpdateDataGlobal('admin', 'partitions', partitions);
        redisClient.updatePartition(JSON.stringify(partitions));

        rep.send({
          status_code : 2000,
          lsPartition : data
        });

        return;
      } //partitions is not exist

      if (partitions['data'] === null || partitions['data'] === undefined || partitions['data'].length <= 0) {
        let data = [];
        data.push({
          id      : id,
          region  : region,
          name    : name,
          pos     : pos
        });

        let distane_ani_board = (partitions['distane_ani_board'] === null || partitions['distane_ani_board'] === undefined) ? 50 : partitions['distane_ani_board'];
        let dura_ani_board    = (partitions['dura_ani_board'] === null || partitions['dura_ani_board'] === undefined) ? 0.1 : partitions['dura_ani_board'];
        let dura_knife_fly    = (partitions['dura_knife_fly'] === null || partitions['dura_knife_fly'] === undefined) ? 0.1 : partitions['dura_knife_fly'];
        let partition         = (partitions['partition'] === null || partitions['partition'] === undefined) ? 12 : partitions['partition'];
        let veloc             = (partitions['veloc'] === null || partitions['veloc'] === undefined) ? 3000 : partitions['veloc'];

        let tmpPar = {
          distane_ani_board : distane_ani_board,
          dura_ani_board    : dura_ani_board,
          dura_knife_fly    : dura_knife_fly,
          partition         : partition,
          veloc             : veloc,
          data              : data
        }

        FS.FSUpdatePartition(tmpPar);
        redisClient.updatePartition(JSON.stringify(tmpPar));

        rep.send({
          status_code : 2000,
          lsPartition : data
        });

        return;
      } //list region is not exist in partitions

      if (setupFunc.posIsExistInLsRegion(partitions['data'], pos) === true) {
        throw `${pos} is exist in partition`;
      }

      partitions['data'].push({
        id      : id,
        name    : name,
        region  : region,
        pos     : pos
      });

      FS.FSUpdatePartition(partitions);
      redisClient.updatePartition(JSON.stringify(partitions));

      rep.send({
        status_code : 2000,
        lsPartition : partitions['data']
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/delete-partition', async (req, rep) => {
    try {

      let pos = parseInt(req.body.pos, 10);
      if (isNaN(pos)) throw `pos is NaN!`;

      let partitions = await FS.FSGetPartition();
      if (partitions['data'] === null || partitions['data'] === undefined) throw `Delete partition failed!`;

      let result = setupFunc.deletePartitionBy(partitions['data'], pos);
      if (result['status'] === false) throw `${pos} is not exist in list partition!`;

      partitions['data'] = result['lsPartitionUpdate'];
      FS.FSUpdatePartition(partitions);
      redisClient.updatePartition(JSON.stringify(partitions));

      rep.send({
        status_code       : 2000,
        lsPartitionUpdate : result['lsPartitionUpdate']
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/get-partition-by-id', async (req, rep) => {
    try {

      let pos = parseInt(req.body.pos, 10);
      if (isNaN(pos)) throw `pos is NaN!`;

      let [partitions, lsItem] = await Promise.all([
        FS.FSGetPartition(),
        FS.FSGetAllItem()
      ]);

      if (partitions['data']  === null || partitions['data']  === undefined ||
          lsItem              === null || lsItem              === undefined) {
        throw `List partition is not exist!`;
      }

      let parAtPos = partitions['data'].find(e => { return e['pos'] === pos });
      if (parAtPos === null || parAtPos === undefined) throw `${pos} is not exist`;

      rep.send({
        status_code : 2000,
        partition   : parAtPos,
        lsItem      : lsItem,
        lsRegion    : config.REGIONS
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/update-partition', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let pos     = parseInt(req.body.pos, 10);
      let name    = req.body.name.toString().trim();
      let region  = req.body.region.toString().trim();

      if (isNaN(id) || isNaN(pos) || name === null || name === undefined || name === '' ||
          region === null || region === undefined || region === '') {
        throw `Check info partition!`;
      }

      let [partitions, lsItem] = await Promise.all([
        FS.FSGetPartition(),
        FS.FSGetAllItem()
      ]);

      if (partitions['data']  === null || partitions['data']  === undefined ||
          lsItem              === null || lsItem              === undefined) {
        throw `Update partition failed!`;
      }

      let parAtPos = setupFunc.findPartitionAndIndex(partitions['data'], pos);
      if (parAtPos === null || parAtPos === undefined) throw `Partition is not exist!`;

      parAtPos['item']['id']      = id;
      parAtPos['item']['name']    = name;
      parAtPos['item']['region']  = region;

      partitions['data'][`${parAtPos['index']}`] = parAtPos['item'];

      FS.FSUpdatePartition(partitions);
      redisClient.updatePartition(JSON.stringify(partitions));

      rep.send({
        status_code     : 2000,
        lsPartition     : partitions['data']
      });
    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  //setup item
  app.get('/get-config-item', async (req, rep) => {
    try {

      let data = await DS.DSGetAllItem();
      if (data === null || data === undefined) {
        data = [];
      }

      rep.view('/partials/config_item_view.ejs', {
        data    : data
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.get('/get-all-item', async (req, rep) => {
    try {

      let lsItem = await DS.DSGetAllItem();
      if (lsItem === null || lsItem === undefined) {
        lsItem = [];
      }

      rep.send({
        status_code : 2000,
        lsItem      : lsItem,
        lsRegion    : config.REGIONS
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/add-item', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let type    = parseInt(req.body.type, 10);
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);
      let save    = req.body.save;
      let special = req.body.special;

      if (isNaN(id) || isNaN(maximum) || isNaN(percent) || isNaN(type) || typeof save !== "boolean" || typeof special !== "boolean" ||
          name === '' || name === null || name === undefined || save === null || save === undefined || special === null || special === undefined ||
          id < 0    || maximum < 0    || percent < 0) {
        throw 'Add item failed!';
      }

      let lsItem = await DS.DSGetAllItem();
      if (setupFunc.idExistIn(lsItem, id) === true) {
        throw `id ${id} already exist!`;
      }

      let itemJs = {
        id            : id,
        type          : type,
        name          : name,
        amount        : 0,
        maximum       : maximum,
        percent       : percent,
        save          : save,
        special_item  : special
      }

      lsItem.push(itemJs);

      redisClient.initItemBy(id);
      redisClient.updateArrItem(JSON.stringify(lsItem));
      DS.DSUpdateDataGlobal('items', id, itemJs);

      rep.send({
        status_code : 2000,
        lsItem      : lsItem
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/delete-item', async (req, rep) => {
    try {

      let id                    = parseInt(req.body.id, 10);
      let [lsItem, partitions]  = await Promise.all([
        DS.DSGetAllItem(),
        DS.DSGetDataGlobal('admin', 'partitions')
      ]);

      if (partitions !== null && partitions !== undefined) {
        if (isNaN(id) || lsItem === null || lsItem === undefined      ||
          setupFunc.chkItemExistInPartition(partitions['data'], id) === true) {
          throw `delete item failed ${id}!`;
        }
      }

      let lsItemUpdate = setupFunc.deleteItemBy(lsItem, id);
      if (lsItemUpdate['status'] === false) throw `${id} is not exist!`;

      DS.DSDeleteItemBy('items', id);
      redisClient.delKeyItem(id);
      redisClient.updateArrItem(JSON.stringify(lsItemUpdate['lsItemUpdate']));

      rep.send({
        status_code   : 2000,
        lsItemUpdate  : lsItemUpdate['lsItemUpdate']
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/get-item-by-id', async (req, rep) => {
    try {

      let id = parseInt(req.body.id, 10);
      if (isNaN(id)) throw `Id is not a number`;

      let item = await DS.DSGetDataGlobal('items', id);
      if (item === null || item === undefined) throw `${id} is not exist in list item!`;

      rep.send({
        status_code : 2000,
        item        : item
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/update-item', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);

      if (isNaN(id) || isNaN(maximum) || isNaN(percent)       ||
          name === '' || name === null || name === undefined  ||
          id < 0    || maximum < 0    || percent < 0) {
        throw `Edit item failed!`;
      }

      let lsItem = await DS.DSGetAllItem();
      if (lsItem === null || lsItem === undefined) throw `List item is not exist!`;

      let tmp = setupFunc.findItemAndIndex(lsItem, id);
      if (tmp === null || tmp === undefined) throw `Can not find item by ${id}`;

      tmp['item']['name']         = name;
      tmp['item']['maximum']      = maximum;
      tmp['item']['percent']      = percent;
      lsItem[tmp['index']]        = tmp['item'];

      DS.DSUpdateDataGlobal('items', id, tmp['item']);
      redisClient.updateArrItem(JSON.stringify(lsItem));

      rep.send({
        status_code   : 2000,
        lsItemUpdate  : lsItem
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.post('/recovery-data', async (req, rep) => {
    try {

      let partitions = await DS.DSGetDataGlobal('admin', 'partitions');
      if (partitions === null || partitions === undefined) throw 'recovery data failed!';
      redisClient.updatePartition(JSON.stringify(partitions));

      let lsItem = await DS.DSGetAllItem();
      if (lsItem === null || lsItem === undefined) throw 'recovery data failed!';

      redisClient.updateArrItem(JSON.stringify(lsItem));
      for (e of lsItem) {
        redisClient.updateAmountItemBy(e['id'], e['amount']);
      }

      //TODO: recovery all data global

      rep.send({
        status_code : 2000
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  //setup mission
  app.get('/get-config-mission', async (req, rep) => {
    try {

      let lsMission = await FS.FSGetDataAdminBy('missions');
      if (lsMission === null || lsMission === undefined) {
        lsMission = [];
        lsMission.push(...config.MISSIONS);
      }

      let lsSupportItem = await FS.FSGetSupportItem();
      if (lsSupportItem === null || lsSupportItem === undefined) {
        lsSupportItem = [];
        lsSupportItem.push(...SUPPORTING_ITEM);
      }

      let missionFilter = setupFunc.filterLsMission(lsMission, lsSupportItem);

      rep.view('/partials/config_mission_view.ejs', {
        data  : missionFilter
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/get-config-mission-by-id', async (req, rep) => {
    try {

      let id = parseInt(req.body.id, 10);
      if (isNaN(id)) throw 'Can not get misson!';

      let lsMission = await FS.FSGetDataAdminBy('missions');
      if (lsMission === null || lsMission === undefined) {
        lsMission = [];
        lsMission.push(...config.MISSIONS);
      }

      let lsSpItem = await FS.FSGetSupportItem();
      if (lsSpItem === null || lsSpItem === undefined) {
        lsSpItem = [];
        lsSpItem.push(...config.SUPPORTING_ITEM);
      }

      let itemMission = lsMission.find(e => { return e['id'] === id });
      if (itemMission === null || itemMission === undefined) throw `${id} is not exist!`;

      if (itemMission['id_sp_item'] !== null) {
        let tmpSp = lsSpItem.find(e => { return e['id'] === itemMission['id_sp_item'] });
        if (tmpSp === null || tmpSp === undefined) throw 'Edit mission failed!';

        rep.send({
          status_code   : 2000,
          item_mission  : {
            id          : itemMission['id'],
            description : itemMission['description'],
            sp_item     : tmpSp,
            status      : itemMission['status']
          }
        });
      }
      else {
        rep.send({
          status_code   : 2000,
          item_mission  : {
            id          : itemMission['id'],
            description : itemMission['description'],
            bonus       : itemMission['bonus'],
            sp_item     : null,
            status      : itemMission['status']
          }
        });
      }

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.get('/get-supporting-item', async (req, rep) => {
    try {

      let lsSupportItem = await FS.FSGetSupportItem();
      if (lsSupportItem === null || lsSupportItem === undefined) {
        lsSupportItem = config.SUPPORTING_ITEM;
      }

      rep.view('/partials/config_supporting_item_view.ejs', {
        data  : lsSupportItem
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/update-support-item', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let bonus   = parseInt(req.body.bonus, 10);

      if (isNaN(id) || isNaN(bonus)) throw `Update support item failed!`;

      let lsSupportItem = await FS.FSGetSupportItem();
      if (lsSupportItem === null || lsSupportItem === undefined) {
        let itemFind = config.SUPPORTING_ITEM.find(e => { return e['id'] === id });
        if (itemFind === null || itemFind === undefined) throw `${id} support item is not exist!`;

        itemFind['bonus'] = bonus;
        FS.FSUpdateSupportItem(config.SUPPORTING_ITEM);

        rep.send({
          status_code : 2000,
          lsSupportItemUpdate : config.SUPPORTING_ITEM
        });
      }
      else {
        let itemFind = lsSupportItem.find(e => { return e['id'] === id });
        if (itemFind === null || itemFind === undefined) throw `${id} support item is not exist!`;

        itemFind['bonus'] = bonus;
        FS.FSUpdateSupportItem(lsSupportItem);

        rep.send({
          status_code : 2000,
          lsSupportItemUpdate : lsSupportItem
        });
      }

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

}

module.exports = setupRoute;