const FS                = require('../../repository/firestore');
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

  app.post('/partition', async (req, rep) => {
    try {

      const dataPartition = req.body.data;
      FS.FSUpdatePartition(dataPartition);
      redisClient.updatePartition(JSON.stringify(dataPartition));

      rep.send({
        status_code : 2000,
        result      : 'success'
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

  app.get('/get-partition', async (req, rep) => {
    try {

      let dataPartition = await FS.FSGetPartition();
      redisClient.updatePartition(JSON.stringify(dataPartition));

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

  app.get('/get-all-item', async (req, rep) => {
    try {

      let data = await FS.FSGetAllItem();
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

  app.get('/data/get-all-item', async (req, rep) => {
    try {

      let lsItem = await FS.FSGetAllItem();
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
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);
      let save    = req.body.save;
      let special = req.body.special;

      if (isNaN(id) || isNaN(maximum) || isNaN(percent) || typeof save !== "boolean" || typeof special !== "boolean" ||
        name === '' || name === null || name === undefined || save === null || save === undefined || special === null || special === undefined ||
          id < 0    || maximum < 0    || percent < 0) {
        throw `Add item failed!`;
      }

      let lsItem = await FS.FSGetAllItem();
      if (setupFunc.idExistIn(lsItem, id) === true) {
        throw `id ${id} already exist!`;
      }

      let itemJs = {
        id            : id,
        name          : name,
        maximum       : maximum,
        percent       : percent,
        save          : save,
        special_item  : special
      }

      lsItem.push(itemJs);

      redisClient.updateArrItem(JSON.stringify(lsItem));
      FS.FSUpdateARRItemBy(id, itemJs);

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

      let id      = parseInt(req.body.id, 10);
      let lsItem  = await FS.FSGetAllItem();

      //TODO: check idItem is exist in list partition. if exist throw error

      if (isNaN(id) || lsItem === null || lsItem === undefined) {
        throw `delete item failed ${id}!`;
      }

      let lsItemUpdate = setupFunc.deleteItemBy(lsItem, id);
      if (lsItemUpdate['status'] === false) throw `${id} is not exist!`;

      FS.FSDeleteItemBy(id);
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

      let lsItem = await FS.FSGetAllItem();
      if (lsItem === null || lsItem === undefined) throw `List item is not exist`;

      let itemUpdate = lsItem.find(e => { return e['id'] === id });
      if (itemUpdate === null || itemUpdate === undefined) throw 'item is not exsit';

      rep.send({
        status_code : 2000,
        item        : itemUpdate
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
      let save    = req.body.save;
      let special = req.body.special;

      if (isNaN(id) || isNaN(maximum) || isNaN(percent) || typeof save !== "boolean" || typeof special !== "boolean" ||
        name === '' || name === null || name === undefined || save === null || save === undefined || special === null || special === undefined ||
          id < 0    || maximum < 0    || percent < 0) {
        throw `Edit item failed!`;
      }

      let lsItem = await FS.FSGetAllItem();
      if (lsItem === null || lsItem === undefined) throw `List item is not exist!`;

      let tmp = setupFunc.findItemAndIndex(lsItem, id);
      if (tmp === null || tmp === undefined) throw `Can not find item by ${id}`;

      tmp['item']['name']         = name;
      tmp['item']['maximum']      = maximum;
      tmp['item']['percent']      = percent;
      tmp['item']['save']         = save;
      tmp['item']['special_item'] = special;
      lsItem[tmp['index']]        = tmp['item'];

      FS.FSUpdateARRItemBy(id, tmp['item']);
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
}

module.exports = setupRoute;