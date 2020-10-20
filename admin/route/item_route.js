const itemFunc              = require('../functions/item_func');

const itemRoute = async (app, opt) => {

  app.get('/get-all-item', async (req, rep) => {
    try {

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

}

module.exports = itemRoute;