const itemFunc              = require('../functions/item_func');
const redisClient           = require('../../redis/redis_client');
const DS                    = require('../../repository/datastore');
const jwt                   = require('../../utils/jwt');
const signinFunc            = require('../functions/signin_func');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../../config_prod');
}
else {
  config = require('../../config_dev');
}

const itemRoute = async (app, opt) => {

  app.get('/get-all-item/:token', async (req, rep) => {
    try {

      let token = req.params.token;
      if (!jwt.verify(token, signinFunc.SECRETE)) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

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
        details     : result['details']
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