const request             = require('request');

const URL_LOG_ADMIN_TOOL  = 'http://13.229.140.173:9880/knife.admin';

exports.logAdminTool = (action, account, data) => {
  request.post({
    url     : URL_LOG_ADMIN_TOOL,
    headers : {
      "content-type": "application/json",
    },
    json    : {
      action  : action,
      account : account,
      time    : new Date().getTime(),
      data    : data
    }
  }, (err, res, body) => {

    // if (err)
    //   console.log(err);

  });
}