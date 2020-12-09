const DS                  = require('../../repository/datastore');
const dashboardFunc       = require('../functions/dashboard_func');
const jwt                 = require('../../utils/jwt');
const signinFunc          = require('../functions/signin_func');
const roleFunc            = require('../functions/role_func');

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

      let lsAllMegaID = await DS.DSGetAllUser();
      let [lsAllDataUser, lsHisAllUser] = await Promise.all([
        dashboardFunc.getAllDataUser(lsAllMegaID),
        dashboardFunc.getHistoryAllUser(lsAllMegaID)
      ]);

      let totalUniqueUser     = dashboardFunc.totalUniqueUserJoinGame(lsAllMegaID, lsAllDataUser, date, date);
      let totalNewbieUser     = dashboardFunc.totalNewbieUserByDate(lsAllMegaID, lsAllDataUser, date, date);
      let totalTurnCreate     = dashboardFunc.totalTurnCreateByDate(lsAllMegaID, lsAllDataUser, date, date);
      let totalTurnUsed       = dashboardFunc.totalTurnUsedByDate(lsAllMegaID, lsHisAllUser, date, date);
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

      let lsAllMegaID = await DS.DSGetAllUser();
      let [lsAllDataUser, lsHisAllUser] = await Promise.all([
        dashboardFunc.getAllDataUser(lsAllMegaID),
        dashboardFunc.getHistoryAllUser(lsAllMegaID)
      ]);

      let totalUniqueUser     = dashboardFunc.totalUniqueUserJoinGame(lsAllMegaID, lsAllDataUser, tmpDateF, tmpDateT);
      let totalNewbieUser     = dashboardFunc.totalNewbieUserByDate(lsAllMegaID, lsAllDataUser, tmpDateF, tmpDateT);
      let totalTurnCreate     = dashboardFunc.totalTurnCreateByDate(lsAllMegaID, lsAllDataUser, tmpDateF, tmpDateT);
      let totalTurnUsed       = dashboardFunc.totalTurnUsedByDate(lsAllMegaID, lsHisAllUser, tmpDateF, tmpDateT);
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

  //not use
  app.post('/get-unique-user', async (req, rep) => {
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
      if (isNaN(tmpDateF.getTime()) || isNaN(tmpDateT.getTime()) || 
          tmpDateF.getTime() > tmpDateT.getTime()) {
        
        throw `Invalid date!`;
      
      }

      let lsAllMegaID     = await DS.DSGetAllUser();
      let lsAllDataUser   = await dashboardFunc.getAllDataUser(lsAllMegaID);
      let totalUniqueUser = dashboardFunc.totalUniqueUserJoinGame(lsAllMegaID, lsAllDataUser, tmpDateF, tmpDateT);

      rep.send({
        status_code : 2000,
        result      : totalUniqueUser
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

  app.post('/get-unique-user-enter-code', async (req, rep) => {
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
      if (isNaN(tmpDateF.getTime()) || isNaN(tmpDateT.getTime()) || 
          tmpDateF.getTime() > tmpDateT.getTime()) {
        
        throw `Invalid date!`;
      
      }

      let lsAllMegaID               = await DS.DSGetAllUser();
      let lsAllDataUser             = await dashboardFunc.getAllDataUser(lsAllMegaID);
      let totalUniqueUserEnterCode  = dashboardFunc.totalUserEnterCode(lsAllDataUser, tmpDateF, tmpDateT);

      rep.send({
        status_code : 2000,
        result      : totalUniqueUserEnterCode
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

  app.post('/get-newbie-user', async (req, rep) => {
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

      let date = new Date(req.body.date_str.toString().trim());
      if (isNaN(date.getTime())) throw 'Invalid date!';

      let lsAllMegaID     = await DS.DSGetAllUser();
      let lsAllDataUser   = await dashboardFunc.getAllDataUser(lsAllMegaID);
      let totalNewbieUser = dashboardFunc.totalNewbieUserByDate(lsAllMegaID, lsAllDataUser, date.getTime());

      rep.send({
        status_code : 2000,
        result      : totalNewbieUser
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

  app.post('/get-total-turn-create', async (req, rep) => {
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

      let date = new Date(req.body.date_str.toString().trim());
      if (isNaN(date.getTime())) throw 'Invalid date!';

      let lsAllMegaID     = await DS.DSGetAllUser();
      let lsAllDataUser   = await dashboardFunc.getAllDataUser(lsAllMegaID);
      let totalTurnCreate = dashboardFunc.totalTurnCreateByDate(lsAllMegaID, lsAllDataUser, date.getTime());

      rep.send({
        status_code : 2000,
        result      : totalTurnCreate
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

  app.post('/get-total-turn-used', async (req, rep) => {
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

      let date = new Date(req.body.date_str.toString().trim());
      if (isNaN(date.getTime())) throw 'Invalid date!';

      let lsAllMegaID     = await DS.DSGetAllUser();
      let lsHisAllUser    = await dashboardFunc.getHistoryAllUser(lsAllMegaID);
      let totalTurnUsed   = dashboardFunc.totalTurnUsedByDate(lsAllMegaID, lsHisAllUser, date.getTime());

      rep.send({
        status_code : 2000,
        result      : totalTurnUsed
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

  app.post('/get-total-turn-remain', async (req, rep) => {
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

      let date = new Date(req.body.date_str.toString().trim());
      if (isNaN(date.getTime())) throw 'Invalid date!';

      let lsAllMegaID = await DS.DSGetAllUser();
      let [lsAllDataUser, lsHisAllUser] = await Promise.all([
        dashboardFunc.getAllDataUser(lsAllMegaID),
        dashboardFunc.getHistoryAllUser(lsAllMegaID)
      ]);

      let totalTurnCreate = dashboardFunc.totalTurnCreateByDate(lsAllMegaID, lsAllDataUser, date.getTime());
      let totalTurnUsed   = dashboardFunc.totalTurnUsedByDate(lsAllMegaID, lsHisAllUser, date.getTime());
      let totalTurnRemain = totalTurnCreate - totalTurnUsed;

      if (totalTurnRemain < 0) totalTurnRemain = 0;
      rep.send({
        status_code : 2000,
        result      : totalTurnRemain
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

  app.post('/get-total-enter-code', async (req, rep) => {
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

      let date = new Date(req.body.date_str.toString().trim());
      if (isNaN(date.getTime())) throw 'Invalid date!';

      let lsAllMegaID     = await DS.DSGetAllUser();
      let lsAllDataUser   = await dashboardFunc.getAllDataUser(lsAllMegaID);
      let totalEnterCode  = dashboardFunc.totalEnterCode(lsAllDataUser, date);

      rep.send({
        status_code : 2000,
        result      : totalEnterCode
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
  //not use
}

module.exports = dashboardRoute;