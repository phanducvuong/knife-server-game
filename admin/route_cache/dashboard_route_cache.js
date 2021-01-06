const dashboardFunc         = require('../function_cache/dashboard_func_cache');
const jwt                   = require('../../utils/jwt');
const signinFunc            = require('../functions/signin_func');
const roleFunc              = require('../functions/role_func');
const redis                 = require('../../redis/redis_client');

const dashboardRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    try {

      let token         = req.query.token;
      let resultVerify  = await jwt.verify(token, signinFunc.SECRETE);
      if (!resultVerify['status']) {
        rep.redirect('/api/v1/admin/signin');
        return;
      }

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[0]['id'])) throw 'Permission denied!';

      let date = new Date();
      date.setHours(0, 0, 0, 0);

      let [lsAllMegaIDTurnInven, lsAllMegaIDHis] = await Promise.all([
        redis.getAllKeyBy('turn_inven'),
        redis.getAllKeyBy('his')
      ]);

      let [lsAllDataUser, lsAllHisUser] = await Promise.all([
        dashboardFunc.getAllDataTurnInven(lsAllMegaIDTurnInven),
        dashboardFunc.getHistoryAllUser(lsAllMegaIDHis)
      ]);

      let totalUniqueUser     = dashboardFunc.totalUniqueUserJoinGame(lsAllDataUser, date, date);
      let totalNewbieUser     = dashboardFunc.totalNewbieUserByDate(lsAllDataUser, date, date);
      let totalTurnCreate     = dashboardFunc.totalTurnCreateByDate(lsAllDataUser, date, date);
      let totalTurnUsed       = dashboardFunc.totalTurnUsedByDate(lsAllHisUser, date, date);
      let totalEnterCode      = dashboardFunc.totalEnterCode(lsAllDataUser, date, date);
      let totalUserEnterCode  = dashboardFunc.totalUserEnterCode(lsAllDataUser, date, date);

      let totalTurnRemain = totalTurnCreate - totalTurnUsed;
      if (totalTurnRemain < 0) totalTurnRemain = 0;

      rep.view('/partials/dashboard_view.ejs', {
        total_unique_user     : totalUniqueUser,
        total_newbie_user     : totalNewbieUser,
        total_turn_created    : totalTurnCreate,
        total_turn_used       : totalTurnUsed,
        total_turn_remain     : totalTurnRemain,
        total_enter_code      : totalEnterCode,
        total_user_enter_code : totalUserEnterCode
      });

    }
    catch(err) {

      console.log(err);

      rep.view('/partials/error_view.ejs', {
        title_error : err
      });

    }
  });

  app.post('/update-statistical', async (req, rep) => {
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

      if (!resultVerify['mailer']['role'].includes(roleFunc.GETROLES()[0]['id'])) throw 'Permission denied!';

      let fromDate    = req.body.from_date.toString().trim();
      let toDate      = req.body.to_date.toString().trim();

      let tmpDateF    = new Date(fromDate);
      let tmpDateT    = new Date(toDate);
      if (isNaN(tmpDateF.getTime()) ||  isNaN(tmpDateT.getTime()) || 
          tmpDateF.getTime()        >   tmpDateT.getTime()) {
        
        throw `Invalid date!`;
      
      }
      tmpDateF.setHours(0, 0, 0, 0);
      tmpDateT.setHours(0, 0, 0, 0);

      let [lsAllMegaIDTurnInven, lsAllMegaIDHis] = await Promise.all([
        redis.getAllKeyBy('turn_inven'),
        redis.getAllKeyBy('his')
      ]);

      let [lsAllDataUser, lsAllHisUser] = await Promise.all([
        dashboardFunc.getAllDataTurnInven(lsAllMegaIDTurnInven),
        dashboardFunc.getHistoryAllUser(lsAllMegaIDHis)
      ]);

      let totalUniqueUser     = dashboardFunc.totalUniqueUserJoinGame(lsAllDataUser, tmpDateF, tmpDateT);
      let totalNewbieUser     = dashboardFunc.totalNewbieUserByDate(lsAllDataUser, tmpDateF, tmpDateT);
      let totalTurnCreate     = dashboardFunc.totalTurnCreateByDate(lsAllDataUser, tmpDateF, tmpDateT);
      let totalTurnUsed       = dashboardFunc.totalTurnUsedByDate(lsAllHisUser, tmpDateF, tmpDateT);
      let totalEnterCode      = dashboardFunc.totalEnterCode(lsAllDataUser, tmpDateF, tmpDateT);
      let totalUserEnterCode  = dashboardFunc.totalUserEnterCode(lsAllDataUser, tmpDateF, tmpDateT);

      let totalTurnRemain = totalTurnCreate - totalTurnUsed;
      if (totalTurnRemain < 0) totalTurnRemain = 0;

      rep.send({
        status_code : 2000,
        total_unique_user     : totalUniqueUser,
        total_newbie_user     : totalNewbieUser,
        total_turn_created    : totalTurnCreate,
        total_turn_used       : totalTurnUsed,
        total_turn_remain     : totalTurnRemain,
        total_enter_code      : totalEnterCode,
        total_user_enter_code : totalUserEnterCode
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

module.exports = dashboardRoute;