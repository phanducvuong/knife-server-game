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

      let dataPartition = JSON.parse(await redisClient.getPartition());
      if (dataPartition === null || dataPartition === undefined) {
        dataPartition = await FS.FSGetPartition();
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

  app.post('/items', async (req, rep) => {
    try {

      const data = req.body.data;
      for (e of data) {
        FS.FSUpdateARRItemBy(e['id'], e);
        redisClient.initItemBy(e['id']);
      }
      redisClient.updateArrItem(JSON.stringify(data));

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

  app.get('/get-all-item', async (req, rep) => {
    try {

      let data = await FS.FSGetAllItem();

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

  app.post('/add-item', async (req, rep) => {
    try {

      let id      = parseInt(req.body.id, 10);
      let name    = req.body.name;
      let maximum = parseInt(req.body.maximum, 10);
      let percent = parseInt(req.body.percent, 10);
      let save    = req.body.save;
      let special = req.body.special;

      if (isNaN(id) || isNaN(maximum) || isNaN(percent) || typeof save !== "boolean" || typeof special !== "boolean" || name === '' ||
          id < 0    || maximum < 0    || percent < 0) {
        throw `Add item failed!`;
      }

      let lsItem = await FS.FSGetAllItem();
      if (setupFunc.idExistIn(lsItem, id) === true) {
        throw `id ${id} already exist!`;
      }

      let itemJs = {
        id      : id,
        name    : name,
        maximum : maximum,
        percent : percent,
        save    : save,
        special : special
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