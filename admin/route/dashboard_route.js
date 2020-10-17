const DS                  = require('../../repository/datastore');
const dashboardFunc       = require('../functions/dashboard_func');
const util                = require('../../utils/util');

const dashboardRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let date = new Date();
      date.setHours(0, 0, 0, 0);

      let lsAllMegaID = await DS.DSGetAllUser();
      let [lsAllDataUser, lsHisAllUser] = await Promise.all([
        dashboardFunc.getAllDataUser(lsAllMegaID),
        dashboardFunc.getHistoryAllUser(lsAllMegaID)
      ]);

      let totalUniqueUser = dashboardFunc.totalUniqueUserJoinGame(lsAllMegaID, lsAllDataUser, date, date);
      let totalNewbieUser = dashboardFunc.totalNewbieUserByDate(lsAllMegaID, lsAllDataUser, date.getTime());
      let totalTurnCreate = dashboardFunc.totalTurnCreateByDate(lsAllMegaID, lsAllDataUser, date.getTime());
      let totalTurnUsed   = dashboardFunc.totalTurnUsedByDate(lsAllMegaID, lsHisAllUser, date.getTime());
      let totalTurnRemain = totalTurnCreate - totalTurnUsed;

      rep.view('/partials/dashboard_view.ejs', {
        total_unique_user   : totalUniqueUser,
        total_newbie_user   : totalNewbieUser,
        total_turn_created  : totalTurnCreate,
        total_turn_used     : totalTurnUsed,
        total_turn_remain   : totalTurnRemain
      });

    }
    catch(err) {

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

}

module.exports = dashboardRoute;