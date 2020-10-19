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

}

module.exports = itemRoute;