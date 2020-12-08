const itemFunc              = require('../functions/item_func');
const redisClient           = require('../../redis/redis_client');
const DS                    = require('../../repository/datastore');
const jwt                   = require('../../utils/jwt');
const signinFunc            = require('../functions/signin_func');
const roleFunc              = require('../functions/role_func');
const log                   = require('../../utils/log');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

const itemRoute = async (app, opt) => {

  app.get('/get-all-item', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[1]['id'])) throw 'Permission denied!';

      let lsFilter = await itemFunc.filterOptionItem();
      rep.view('/partials/item_view.ejs', {
        data  : lsFilter
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/get-total-amount-item-by-id', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[1]['id'])) throw 'Permission denied!';

      let idItem  = parseInt(req.body.id_item, 10);
      let dateStr = req.body.date_str.toString().trim();

      let date    = new Date(dateStr);
      if (isNaN(idItem) || isNaN(date.getTime())) throw 'Invalid Date or id item!';

      let result  = await itemFunc.getTotalAmountItemBy(idItem, date.getTime());
      if (!result['status']) throw `Id item not exsit!`;

      rep.send({
        status_code : 2000,
        item        : result['item'],
        total       : result['total'],
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

  //item special
  app.get('/view-add-special-item', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      rep.view('/partials/add_special_item_view.ejs', {
        special_items : config.SPECIAL_ITEM
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/add-special-item', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      let megaID  = req.body.mega_id.toString().trim();
      let idItem  = parseInt(req.body.id_item, 10);

      if (megaID === null || megaID === undefined || isNaN(idItem)) throw `Error!`;

      let date        = new Date();
      let itemSpecial = config.SPECIAL_ITEM.find(e => { return e['id'] === idItem });
      let dataUser    = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined || itemSpecial === null || itemSpecial === undefined) {
        throw `${megaID} or ${idItem} is not exist!`;
      }

      dataUser['special_item'].push(`${idItem}_${date.getTime()}`);
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

      log.logAdminTool('ADD-SPECIAL-ITEM', resultVerify['mailer']['mail'], {mega_code: megaID, item: {id: itemSpecial['id'], description: itemSpecial['description']}});

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

  //del special item in inventory's user
  app.post('/get-list-special-item-user', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      let megaID = req.body.mega_id.toString().trim();
      if (megaID === null || megaID === undefined) throw `Error!`;

      let dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      rep.send({
        status_code : 2000,
        result      : itemFunc.getListItemSpecialUser(dataUser['special_item'])
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

  app.post('/del-special-item', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      let condition = req.body.condition.toString().trim();
      let megaID    = req.body.mega_id.toString().trim();
      if (megaID === null || megaID === undefined || condition === null || condition === undefined || condition === '') {
        throw `Error!`;
      }

      let dataUser = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      let resultDelSpecialItem = itemFunc.delSpecialItemUser(dataUser['special_item'], condition);
      if (!resultDelSpecialItem['status']) throw 'Del failed!';

      dataUser['special_item'] = resultDelSpecialItem['ls_special_item_update'];
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

      log.logAdminTool('DEL-SPECIAL-ITEM-USER', resultVerify['mailer']['mail'], {
        mega_code : megaID,
        item      : resultDelSpecialItem['special_item']
      });

      rep.send({
        status_code             : 2000,
        ls_special_item_update  : itemFunc.getListItemSpecialUser(dataUser['special_item'])
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

  //set turn for user
  app.post('/set-turn', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      let megaID  = req.body.mega_id.toString().trim();
      let turn    = parseInt(req.body.turn, 10);

      if (megaID === null || megaID === undefined || isNaN(turn)) throw `Check input data!`;

      let dataUser    = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      dataUser['turn'] += turn;
      if (dataUser['turn'] < 0) dataUser['turn'] = 0;

      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

      log.logAdminTool('SET-TURN', resultVerify['mailer']['mail'], {mega_code: megaID, turn: turn});

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

  //set turn for user
  app.post('/update-lucky-code-user', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[3]['id'])) throw 'Permission denied!';

      let luckyCodes  = req.body.ls_lucky_code;
      let action      = parseInt(req.body.action, 10);

      if (luckyCodes === null || luckyCodes === undefined || luckyCodes.length <= 0 || isNaN(action)) throw `Check input data!`;

      let dataUser    = await DS.DSGetDataUser(megaID, 'turn_inven');
      if (dataUser === null || dataUser === undefined) {
        throw `${megaID} is not exist!`;
      }

      dataUser['turn'] += turn;
      if (dataUser['turn'] < 0) dataUser['turn'] = 0;

      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

      log.logAdminTool('SET-TURN', resultVerify['mailer']['mail'], {
        mega_code : megaID,
        turn      : turn
      });

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
}

module.exports = itemRoute;