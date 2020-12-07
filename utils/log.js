const request             = require('request');

const URL_LOG_ADMIN_TOOL  = 'http://13.229.140.173:9880/knife.admin';

exports.logAdminTool = (action, account, data) => {
  let req = {
    action  : action,
    account : account,
    // time    : new Date().getTime(),
    data    : data
  };

  // try {
  //   request.post({

  //     url     : URL_LOG_ADMIN_TOOL,
  //     headers : {
  //       "Connection"            : 'Keep-Alive',
  //       "Content-Type"          : "application/json",
  //     },
  //     json  : req
  //   }, (err, res, body) => {
      
  //     // console.log(JSON.stringify(res));
  
  //     if (err)
  //       console.log(err);
  
  //   });
  // }
  // catch(err) {
  //   console.log('error');
  //   console.log(err);
  // }
}