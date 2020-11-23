const DS                = require('../../repository/datastore');
const redisClient       = require('../../redis/redis_client');
const setupFunc         = require('../functions/setup_func');
const util              = require('../../utils/util');
const jwt               = require('../../utils/jwt');
const signinFunc        = require('../functions/signin_func');

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let partition     = parseInt(req.body.partition, 10);
      let veloc         = parseInt(req.body.veloc, 10);
      let duraKnifeFly  = parseFloat(req.body.dura_knife_fly, 10);
      let duraInimBoard = parseFloat(req.body.dura_ani_board, 10);
      let disAnimBoard  = parseInt(req.body.distane_ani_board, 10);

      if (isNaN(partition) || isNaN(veloc) || isNaN(duraKnifeFly) || isNaN(duraInimBoard) || isNaN(disAnimBoard)) {
        throw 'Check info board!';
      }

      let partitions = await DS.DSGetDataGlobal('admin', 'partitions');
      if (partitions === null || partitions === undefined) {
        let tmpPartition = {
          partition           : partition,
          veloc               : veloc,
          dura_knife_fly      : duraKnifeFly,
          dura_ani_board      : duraInimBoard,
          distane_ani_board   : disAnimBoard,
          data                : []
        }

        DS.DSUpdateDataGlobal('admin', 'partitions', tmpPartition);
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

      DS.DSUpdateDataGlobal('admin', 'partitions', partitions);
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

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

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

        DS.DSUpdateDataGlobal('admin', 'partitions', tmpPar);
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

      DS.DSUpdateDataGlobal('admin', 'partitions', partitions);
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let pos = parseInt(req.body.pos, 10);
      if (isNaN(pos)) throw `pos is NaN!`;

      let partitions = await DS.DSGetDataGlobal('admin', 'partitions');
      if (partitions['data'] === null || partitions['data'] === undefined) throw `Delete partition failed!`;

      let result = setupFunc.deletePartitionBy(partitions['data'], pos);
      if (result['status'] === false) throw `${pos} is not exist in list partition!`;

      partitions['data'] = result['lsPartitionUpdate'];
      DS.DSUpdateDataGlobal('admin', 'partitions', partitions);
      redisClient.updatePartition(JSON.stringify(partitions));

      rep.send({
        status_code       : 2000,
        message           : 'Delete partition success',
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let pos = parseInt(req.body.pos, 10);
      if (isNaN(pos)) throw `pos is NaN!`;

      let [partitions, lsItem] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'partitions'),
        DS.DSGetAllItem()
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id      = parseInt(req.body.id, 10);
      let pos     = parseInt(req.body.pos, 10);
      let name    = req.body.name.toString().trim();
      let region  = req.body.region.toString().trim();

      if (isNaN(id) || isNaN(pos) || name === null || name === undefined || name === '' ||
          region === null || region === undefined || region === '') {
        throw `Check info partition!`;
      }

      let [partitions, lsItem] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'partitions'),
        DS.DSGetAllItem()
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

      DS.DSUpdateDataGlobal('admin', 'partitions', partitions);
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

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id      = parseInt(req.body.id, 10);
      let type    = parseInt(req.body.type, 10);
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);
      let save    = req.body.save;
      let special = req.body.special;

      if (isNaN(id)   || isNaN(maximum) || isNaN(percent)     || isNaN(type)    || typeof save !== "boolean" || typeof special !== "boolean"  ||
          name === '' || name === null  || name === undefined || save === null  || save        === undefined || special        === null       || special === undefined ||
          id < 0      || percent < 0) {
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id      = parseInt(req.body.id, 10);
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);

      if (isNaN(id)   || isNaN(maximum) || isNaN(percent)       ||
          name === '' || name === null  || name === undefined   ||
          id < 0      || percent < 0) {
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

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

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let missionDS = await DS.DSGetDataGlobal('admin', 'missions');

      let lsMission;
      if (missionDS === null || missionDS === undefined) {
        lsMission = [];
        lsMission.push(...config.MISSIONS);
      }
      else {
        lsMission = missionDS.missions;
      }

      rep.view('/partials/config_mission_view.ejs', {
        data  : lsMission
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id = parseInt(req.body.id, 10);
      if (isNaN(id)) throw 'Can not get misson!';

      let missionsDS = await DS.DSGetDataGlobal('admin', 'missions');

      let lsMission;
      if (missionsDS === null || missionsDS === undefined) {
        lsMission = config.MISSIONS;
      }
      else {
        lsMission = missionsDS.missions;
      }

      let itemMission = lsMission.find(e => { return e['id'] === id });
      if (itemMission === null || itemMission === undefined) throw `${id} is not exist!`;

      rep.send({
        status_code : 2000,
        mission     : itemMission
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

  app.post('/add-mission', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id          = parseInt(req.body.id, 10);
      let description = req.body.description.toString().trim();
      let target      = parseInt(req.body.target, 10);
      let bonusTurn   = parseInt(req.body.bonus_turn, 10);
      let spItem      = parseInt(req.body.sp_item, 10);
      let bonusSpItem = parseInt(req.body.bonus_sp_item, 10);
      let status      = parseInt(req.body.status, 10);
      let type        = parseInt(req.body.type, 10);

      if (isNaN(id) || isNaN(target) || isNaN(bonusTurn) || isNaN(status)        || isNaN(spItem)             || isNaN(bonusSpItem) || isNaN(type) ||
          id < 0    || target <= 0   || bonusTurn < 0    || description === null || description === undefined || description === '') {
        throw 'Check info mission!';
      }
      else if (bonusTurn === 0 && bonusSpItem <= 0) {
        throw 'Check info bonus turn or bonus sp item';
      }

      let [missionDS, supportingItemDS] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'missions'),
        DS.DSGetDataGlobal('admin', 'supporting_item')
      ]);

      let missions;
      if (missionDS === null || missionDS === undefined) {
        missions = config.MISSIONS;
      }
      else {
        missions = missionDS['missions'];
      }

      let supportingItems;
      if (supportingItemDS === null || supportingItemDS === undefined) {
        supportingItems = config.SUPPORTING_ITEM;
      }
      else {
        supportingItems = supportingItemDS['supporting_item'];
      }

      let missionFind = missions.find(e => { return e['id'] === id });
      if (missionFind !== null && missionFind !== undefined) {
        throw `${id} mission is exist!`;
      }

      let missionAdd;
      let spItemFind = supportingItems.find(e => { return e['id'] === spItem });
      if (spItemFind === null || spItemFind === undefined) {
        if (bonusTurn <= 0) throw `Check bonus turn when sp_item is null ${bonusTurn}  ${spItem}`;
        missionAdd = {
          id            : id,
          description   : description,
          target        : target,
          bonus_turn    : bonusTurn,
          sp_item       : null,
          bonus_sp_item : 0,
          status        : status,
          type          : type
        }
      }
      else {
        missionAdd = {
          id            : id,
          description   : description,
          target        : target,
          bonus_turn    : bonusTurn,
          sp_item       : spItemFind,
          bonus_sp_item : bonusSpItem,
          status        : status,
          type          : type
        }
      }

      missions.push(missionAdd);
      DS.DSUpdateDataGlobal('admin', 'missions', { missions: missions });

      rep.send({
        status_code   : 2000,
        missionUpdate : missions
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

  app.post('/update-mission', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id          = parseInt(req.body.id, 10);
      let description = req.body.description.toString().trim();
      let target      = parseInt(req.body.target, 10);
      let bonusTurn   = parseInt(req.body.bonus_turn, 10);
      let spItem      = parseInt(req.body.sp_item, 10);
      let bonusSpItem = parseInt(req.body.bonus_sp_item, 10);
      let status      = parseInt(req.body.status, 10);

      if (isNaN(id) || isNaN(target) || isNaN(bonusTurn) || isNaN(status)        || isNaN(spItem)             || isNaN(bonusSpItem)       ||
          id < 0    || target < 0   || bonusTurn < 0    || description === null || description === undefined || description === '') {
        throw 'Check info mission!';
      }
      else if (bonusTurn === 0 && bonusSpItem <= 0) {
        throw 'Check info bonus turn or bonus sp item';
      }

      let [missionDS, supportingItemDS] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'missions'),
        DS.DSGetDataGlobal('admin', 'supporting_item')
      ]);

      let missions;
      if (missionDS === null || missionDS === undefined) {
        missions = config.MISSIONS;
      }
      else {
        missions = missionDS['missions'];
      }

      let supportingItems;
      if (supportingItemDS === null || supportingItemDS === undefined) {
        supportingItems = config.SUPPORTING_ITEM;
      }
      else {
        supportingItems = supportingItemDS['supporting_item'];
      }

      let missionFind = missions.find(e => { return e['id'] === id });
      if (missionFind === null || missionFind === undefined) throw `${id} mission is not exist!`;

      let spItemFind = supportingItems.find(e => { return e['id'] === spItem });
      if (spItemFind === null || spItemFind === undefined) {
        if (bonusTurn <= 0) throw `Check bonus turn when bonus sp item is < 0 ${bonusTurn}   ${bonusSpItem}`;
        missionFind['sp_item']        = null;
        missionFind['description']    = description;
        missionFind['target']         = target;
        missionFind['bonus_turn']     = bonusTurn;
        missionFind['bonus_sp_item']  = 0;
        missionFind['status']         = status;
      }
      else {
        missionFind['sp_item']        = spItemFind;
        missionFind['description']    = description;
        missionFind['target']         = target;
        missionFind['bonus_turn']     = bonusTurn;
        missionFind['bonus_sp_item']  = bonusSpItem;
        missionFind['status']         = status;
      }

      DS.DSUpdateDataGlobal('admin', 'missions', { missions: missions });
      rep.send({
        status_code     : 2000,
        missionUpdate  : missions
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

  app.post('/delete-mission', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id = parseInt(req.body.id, 10);
      if (isNaN(id)) throw '0. Delete mission failed!';

      if (id === 0) throw 'Can not delete this mission!';

      let missionDS = await DS.DSGetDataGlobal('admin', 'missions');
      if (missionDS === null || missionDS === undefined) throw '1. Delete mission failed!';

      let result = setupFunc.deleteMissionByID(missionDS['missions'], id);
      if (!result['status']) throw result['msg'];

      DS.DSUpdateDataGlobal('admin', 'missions', { missions: result['missionUpdate'] });
      rep.send({
        status_code   : 2000,
        missionUpdate : result['missionUpdate']
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

  //supporting item
  app.get('/get-supporting-item', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let supportItem = await DS.DSGetDataGlobal('admin', 'supporting_item');
      let lsSupportItem;
      if (supportItem === null || supportItem === undefined) {
        lsSupportItem = config.SUPPORTING_ITEM;
      }
      else {
        lsSupportItem = supportItem.supporting_item;
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

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id          = parseInt(req.body.id, 10);
      let description = req.body.description.toString().trim();

      if (isNaN(id) || description === null || description === undefined || description === '') throw `Update support item failed!`;

      let supportItem = await DS.DSGetDataGlobal('admin', 'supporting_item');
      let lsSupportItem;
      if (supportItem === null || supportItem === undefined) {
        let itemFind = config.SUPPORTING_ITEM.find(e => { return e['id'] === id });
        if (itemFind === null || itemFind === undefined) throw `${id} support item is not exist!`;

        itemFind['description'] = description;
        DS.DSUpdateDataGlobal('admin', 'supporting_item', { supporting_item: config.SUPPORTING_ITEM });

        rep.send({
          status_code : 2000,
          lsSupportItemUpdate : config.SUPPORTING_ITEM
        });
      }
      else {
        lsSupportItem = supportItem.supporting_item;
        let itemFind  = lsSupportItem.find(e => { return e['id'] === id });
        if (itemFind === null || itemFind === undefined) throw `${id} support item is not exist!`;

        itemFind['description'] = description;
        DS.DSUpdateDataGlobal('admin', 'supporting_item', { supporting_item: lsSupportItem });

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

  //setup event
  app.get('/get-config-event', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let eventDS = await DS.DSGetDataGlobal('admin', 'events');

      let events;
      if (eventDS === null || eventDS === undefined) {
        events = config.EVENTS
      }
      else {
        events = eventDS;
      }

      rep.view('/partials/config_event_view.ejs', {
        data  : events
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/get-event-by-id', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let idEvent = parseInt(req.body.id, 10);
      if (isNaN(idEvent)) throw 'Can not get event by id';

      let eventDS = await DS.DSGetDataGlobal('admin', 'events');
      let events;
      if (eventDS === null || eventDS === undefined) {
        events = config.EVENTS;
      }
      else {
        events = eventDS;
      }

      let result = events['data'].find(e => { return e['id'] === idEvent });
      if (result === null || result === undefined) throw 'Event not exist!';

      rep.send({
        status_code : 2000,
        result      : result
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

  app.post('/add-event', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id          = parseInt(req.body.id, 10);
      let description = req.body.description.toString().trim();
      let target      = parseInt(req.body.target, 10);
      let bonusTurn   = parseInt(req.body.bonus_turn, 10);
      let spItem      = parseInt(req.body.sp_item, 10);
      let bonusSpItem = parseInt(req.body.bonus_sp_item, 10);
      let status      = parseInt(req.body.status, 10);
      let type        = parseInt(req.body.type, 10);

      if (isNaN(id) || isNaN(target) || isNaN(bonusTurn) || isNaN(status)        || isNaN(spItem)             || isNaN(bonusSpItem) || isNaN(type) || type < 0 ||
          id < 0    || target <= 0   || bonusTurn < 0    || description === null || description === undefined || description === '') {
        throw 'Check info mission!';
      }
      else if (bonusTurn === 0 && bonusSpItem <= 0) {
        throw 'Check info bonus turn or bonus sp item';
      }

      let [eventDS, spItemDS] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'events'),
        DS.DSGetDataGlobal('admin', 'supporting_item')
      ]);

      let events;
      if (eventDS === null || eventDS === undefined) {
        events = config.EVENTS;
      }
      else {
        events = eventDS;
      }

      let supportingItem;
      if (spItemDS === null || spItemDS === undefined) {
        supportingItem = config.SUPPORTING_ITEM
      }
      else {
        supportingItem = spItemDS['supporting_item'];
      }

      let eventFind = events['data'].find(e => { return e['id'] === id });
      if (eventFind !== null && eventFind !== undefined) throw `Event is Exist!`;

      let eventAdd;
      let spItemFind = supportingItem.find(e => { return e['id'] === spItem });
      if (spItemFind === null || spItemFind === undefined) {
        if (bonusTurn <= 0) throw `Check bonus turn when sp_item is null ${bonusTurn}  ${spItem}`;
        eventAdd = {
          id            : id,
          description   : description,
          target        : target,
          bonus_turn    : bonusTurn,
          sp_item       : null,
          bonus_sp_item : 0,
          status        : status,
          type          : type
        }
      }
      else {
        eventAdd = {
          id            : id,
          description   : description,
          target        : target,
          bonus_turn    : bonusTurn,
          sp_item       : spItemFind,
          bonus_sp_item : bonusSpItem,
          status        : status,
          type          : type
        }
      }

      events['data'].push(eventAdd);
      DS.DSUpdateDataGlobal('admin', 'events', events);

      rep.send({
        status_code   : 2000,
        eventUpdate   : events['data']
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

  app.post('/update-event', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id          = parseInt(req.body.id, 10);
      let description = req.body.description.toString().trim();
      let target      = parseInt(req.body.target, 10);
      let bonusTurn   = parseInt(req.body.bonus_turn, 10);
      let spItem      = parseInt(req.body.sp_item, 10);
      let bonusSpItem = parseInt(req.body.bonus_sp_item, 10);
      let status      = parseInt(req.body.status, 10);
      let fromDate    = req.body.from_date;
      let toDate      = req.body.to_date;

      if (isNaN(id) || isNaN(target) || isNaN(bonusTurn) || isNaN(status)        || isNaN(spItem)             || isNaN(bonusSpItem)       ||
          id < 0    || target <= 0   || bonusTurn < 0    || description === null || description === undefined || description === '') {
        throw 'Check info event!';
      }
      else if (bonusTurn === 0 && bonusSpItem <= 0) {
        throw 'Check info bonus turn or bonus sp item';
      }

      let [eventDS, spItemDS] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'events'),
        DS.DSGetDataGlobal('admin', 'supporting_item')
      ]);

      let events;
      if (eventDS === null || eventDS === undefined) {
        events = config.EVENTS;
      }
      else {
        events = eventDS;
      }

      let supportingItems;
      if (spItemDS === null || spItemDS === undefined) {
        supportingItems = config.SUPPORTING_ITEM;
      }
      else {
        supportingItems = spItemDS['supporting_item'];
      }

      let eventFind = events['data'].find(e => { return e['id'] === id });
      if (eventFind === null || eventFind === undefined) throw `${id} event is not exist!`;

      let spItemFind = supportingItems.find(e => { return e['id'] === spItem });
      if (spItemFind === null || spItemFind === undefined) {
        if (bonusTurn <= 0) throw `Check bonus turn when bonus sp item is < 0 ${bonusTurn} ${bonusSpItem}`;
        eventFind['sp_item']        = null;
        eventFind['description']    = description;
        eventFind['target']         = target;
        eventFind['bonus_turn']     = bonusTurn;
        eventFind['bonus_sp_item']  = 0;
        eventFind['status']         = status;
      }
      else {
        eventFind['sp_item']        = spItemFind;
        eventFind['description']    = description;
        eventFind['target']         = target;
        eventFind['bonus_turn']     = bonusTurn;
        eventFind['bonus_sp_item']  = bonusSpItem;
        eventFind['status']         = status;
      }

      //update time if idEvent is 0
      if (id === 0) {
        let tmpFromDate = new Date(`${fromDate} 00:00:00`);
        let tmpToDate   = new Date(`${toDate} 00:00:00`);

        if (isNaN(tmpFromDate.getTime()) || isNaN(tmpToDate.getTime()) || tmpFromDate.getTime() >= tmpToDate.getTime() || bonusTurn <= 0) {
          throw `Update event failed! Date`;
        }

        
        eventFind['from_date']  = util.convertDateEventToString(tmpFromDate.getTime() - 7 * 3600 * 1000) + ' 17:00:00';
        eventFind['to_date']    = util.convertDateEventToString(tmpToDate.getTime()) + ' 16:59:59';
        eventFind['mul']        = bonusTurn;
        eventFind['target']     = 1;
      }

      DS.DSUpdateDataGlobal('admin', 'events', events);
      rep.send({
        status_code     : 2000,
        eventUpdate     : events['data']
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

  app.post('/delete-event', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let id = parseInt(req.body.id, 10);
      if (isNaN(id)) throw '0. Delete event failed!';

      if (id === 0) throw 'Can not delete this event!';

      let eventDS = await DS.DSGetDataGlobal('admin', 'events');
      if (eventDS === null || eventDS === undefined) throw '1. Delete event failed!';

      let result = setupFunc.deleteEventByID(eventDS, id);
      if (!result['status']) throw result['msg'];

      DS.DSUpdateDataGlobal('admin', 'events', result['eventUpdate']);
      rep.send({
        status_code   : 2000,
        eventUpdate   : result['eventUpdate']['data']
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

  app.post('/update-time-event', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let startTime = req.body.start.toString().trim();
      let endTime   = req.body.end.toString().trim();

      let tmpS      = new Date(startTime);
      let tmpE      = new Date(endTime);

      if (isNaN(tmpS.getTime()) || isNaN(tmpE.getTime()) ||
          tmpS.getTime() >= tmpE.getTime()) {
        throw 'Invalid time!';
      }

      let events = await DS.DSGetDataGlobal('admin', 'events');
      let tmpEvents;
      if (events === null || events === undefined) {
        tmpEvents = config.EVENTS;
      }
      else {
        tmpEvents = events;
      }

      tmpEvents['start']  = startTime;
      tmpEvents['end']    = endTime;
      DS.DSUpdateDataGlobal('admin', 'events', tmpEvents);

      rep.send({
        status_code : 2000,
        msg         : 'Success!'
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

  //black list
  app.get('/get-config-black-list', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let lsBlackList;
      let tmp = await DS.DSGetDataGlobal('admin', 'black_list');
      if (tmp === null || tmp === undefined) lsBlackList = config.BLACK_LIST;
      else lsBlackList = tmp['black_list'];

      rep.view('/partials/config_black_list_view.ejs', {
        data  : lsBlackList
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/add-user-black-list', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let lsMegaCode = req.body.mega_codes; 
      if (lsMegaCode === null || lsMegaCode === undefined || lsMegaCode.length <= 0) throw 'Check info in form!';

      let lsBlackList;
      let lsBlackDS = await DS.DSGetDataGlobal('admin', 'black_list');
      if (lsBlackDS === null || lsBlackDS === undefined) lsBlackList = config.BLACK_LIST;
      else lsBlackList = lsBlackDS['black_list'];

      lsBlackList = setupFunc.addNewUserIntoBlackList(lsBlackList, lsMegaCode);
      DS.DSUpdateDataGlobal('admin', 'black_list', { black_list: lsBlackList });

      rep.send({
        status_code : 2000,
        lsUpdate    : lsBlackList
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

  app.post('/edit-user-black-list', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let megaID  = req.body.mega_codes.toString().trim();
      let status  = parseInt(req.body.status, 10);

      console.log(megaID);

      if (megaID === null || megaID === undefined || isNaN(status)) throw 'Check info form!';

      let lsBL;
      let lsBLDS = await DS.DSGetDataGlobal('admin', 'black_list');
      if (lsBLDS === null || lsBLDS === undefined) lsBL = config.BLACK_LIST;
      else lsBL = lsBLDS['black_list'];

      let tmpUserFind = lsBL.find(e => { return e['mega_code'] === megaID });
      if (tmpUserFind === null || tmpUserFind === undefined) throw `${megaID} is not exist!`;

      tmpUserFind['status'] = status;
      DS.DSUpdateDataGlobal('admin', 'black_list', { black_list: lsBL });

      rep.send({
        status_code : 2000,
        lsUpdate    : lsBL
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

  app.post('/get-user-black-list-by-mega-code', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let megaID = req.body.mega_code.toString().trim();
      if (megaID === null || megaID === undefined) throw 'Unknow mega code!';

      let lsBL;
      let tmpLsBL = await DS.DSGetDataGlobal('admin', 'black_list');
      if (tmpLsBL === null || tmpLsBL === undefined) lsBL = config.BLACK_LIST;
      else lsBL = tmpLsBL['black_list'];

      let tmpUserFind = lsBL.find(e => { return e['mega_code'] === megaID });
      if (tmpUserFind === null || tmpUserFind === undefined) throw `${megaID} is not exist!`;

      rep.send({
        status_code : 2000,
        user        : tmpUserFind
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

  app.post('/del-user-black-list-by-mega-code', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let megaID = req.body.mega_code.toString().trim();
      if (megaID === null || megaID === undefined) throw 'Unknow mega code!';

      let lsBL;
      let tmpLsBL = await DS.DSGetDataGlobal('admin', 'black_list');
      if (tmpLsBL === null || tmpLsBL === undefined) lsBL = config.BLACK_LIST;
      else lsBL = tmpLsBL['black_list'];

      let tmpUserFind = lsBL.find(e => { return e['mega_code'] === megaID });
      if (tmpUserFind === null || tmpUserFind === undefined) throw `${megaID} is not exist!`;

      lsBL = lsBL.filter(e => e['mega_code'] !== megaID);
      DS.DSUpdateDataGlobal('admin', 'black_list', { black_list: lsBL });

      rep.send({
        status_code : 2000,
        lsUpdate    : lsBL
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

  //update countdown
  app.get('/get-config-global', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let [countDownDS, bonusEnterCodeDS, textShowDS] = await Promise.all([
        DS.DSGetDataGlobal('admin', 'count_down'),
        DS.DSGetDataGlobal('admin', 'bonus_enter_code'),
        DS.DSGetDataGlobal('admin', 'text_show')
      ]);

      let countDown = config.COUNT_DOWN;
      if (countDownDS !== null && countDownDS !== undefined) {
        countDown = countDownDS['count_down'];
      }

      let bonusEnterCode = config.BONUS_ENTER_CODE;
      if (bonusEnterCodeDS !== null && bonusEnterCodeDS !== undefined) {
        bonusEnterCode = bonusEnterCodeDS;
      }

      let textShow = config.TEXT_SHOW;
      if (textShowDS !== null && textShowDS !== undefined) {
        textShow = textShowDS;
      }

      rep.view('/partials/config_global_view.ejs', {
        count_down          : `${countDown.split(' ')[0]}T${countDown.split(' ')[1]}`,
        bonus_turn_1        : bonusEnterCode['bonus_1']['bonus_turn'],
        bonus_lucky_code_1  : bonusEnterCode['bonus_1']['bonus_lucky_code'],
        bonus_turn_2        : bonusEnterCode['bonus_2']['bonus_turn'],
        bonus_lucky_code_2  : bonusEnterCode['bonus_2']['bonus_lucky_code'],
        text_show           : textShow
      });

    }
    catch(err) {

      console.log(err);
      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/update-count-down', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let countDown = req.body.count_down;
      let time      = new Date(countDown);
      if (isNaN(time.getTime())) throw `Invalid date! ${countDown}`;

      let month   = (time.getMonth() + 1) < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
      let date    = time.getDate() < 10 ? `0${time.getDate()}` : time.getDate();
      let year    = time.getFullYear();
      let hour    = time.getHours() < 10 ? `0${time.getHours()}` : time.getHours();
      let minute  = time.getMinutes() < 10 ? `0${time.getMinutes()}` : time.getMinutes();

      countDown = `${year}-${month}-${date} ${hour}:${minute}:00`;
      DS.DSUpdateDataGlobal('admin', 'count_down', { count_down: countDown });
      rep.send({
        status_code : 2000,
        msg         : 'Success'
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

  //update bonus enter code
  app.post('/update-bonus-enter-code', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let bonusTurn1          = parseInt(req.body.bonus_turn_1, 10);
      let bonusTurn2          = parseInt(req.body.bonus_turn_2, 10);
      let bonusLuckyCode1     = parseInt(req.body.bonus_lucky_code_1, 10);
      let bonusLuckyCode2     = parseInt(req.body.bonus_lucky_code_2, 10);

      if (isNaN(bonusTurn1) || isNaN(bonusLuckyCode1) || isNaN(bonusTurn2) || isNaN(bonusLuckyCode2)) {
        throw 'Update Failed!';
      }

      let bonusEnterCode = await DS.DSGetDataGlobal('admin', 'bonus_enter_code');
      if (bonusEnterCode === null || bonusEnterCode === undefined) {
        bonusEnterCode = config.BONUS_ENTER_CODE;
      }

      bonusEnterCode['bonus_1']['bonus_turn']       = bonusTurn1;
      bonusEnterCode['bonus_2']['bonus_turn']       = bonusTurn2;
      bonusEnterCode['bonus_1']['bonus_lucky_code'] = bonusLuckyCode1;
      bonusEnterCode['bonus_2']['bonus_lucky_code'] = bonusLuckyCode2;

      DS.DSUpdateDataGlobal('admin', 'bonus_enter_code', bonusEnterCode);
      rep.send({
        status_code : 2000,
        msg         : 'Success'
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

  //update text show
  app.post('/update-text-show', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let text  = req.body.text.toString().trim();
      let count = parseInt(req.body.count, 10);

      if (text === null || text === undefined || text === '' || isNaN(count)) {
        throw 'Invalid info text show!';
      }

      DS.DSUpdateDataGlobal('admin', 'text_show', {
        text  : text,
        count : count
      });

      rep.send({
        status_code : 2000,
        msg         : 'success'
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

  //setup config block acc
  app.get('/get-config-block-acc', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      let result = await DS.DSGetDataGlobal('admin', 'rule_block_acc');
      if (result === null || result === undefined) {
        result = config.RULE_BLOCK_ACC;
      }
      else {
        result = result['rule_block_acc'];
      }

      let ruleFormatTime = setupFunc.formatTimeBlockAccToStr(result);
      if (!ruleFormatTime['status']) throw `Invalid time format!`;

      rep.view('/partials/config_block_acc_view.ejs', {
        data: ruleFormatTime['data']
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/update-block-acc', async (req, rep) => {
    try {

      let headers = req.headers['authorization'];
      if (headers === null || headers === undefined) {
        throw `unvalid token`;
      }

      let token         = headers.split(' ')[1];
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        throw `unvalid token`;
      }

      let dataRules = req.body.rules;
      if (!setupFunc.isValidRules(dataRules)) {
        throw 'invalid data!';
      }

      DS.DSUpdateDataGlobal('admin', 'rule_block_acc', {
        rule_block_acc  : dataRules
      });
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
}

module.exports = setupRoute;