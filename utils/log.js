const request             = require('request');
const axios               = require('axios');

const URL_LOG_ADMIN_TOOL  = 'http://13.229.140.173:9880/knife.admin';

exports.logAdminTool = (action, account, data) => {
  let req = {
    action  : action,
    type    : account,
    msg     : JSON.stringify(data),
    source  : ''
  }

  axios.post('http://13.229.140.173:9880/knife.admin', req).then((res) => {}).catch(err => {});

  // try {
  //   request.post({

  //     url     : URL_LOG_ADMIN_TOOL,
  //     headers : {
  //       // "Connection"            : 'Keep-Alive',
  //       'Content-Type': 'application/json; charset=utf-8',
  //       // 'Content-Length': Buffer.byteLength(JSON.stringify(req)),
  //       // 'Accept': 'application/json',
  //       // 'Accept-Encoding': 'gzip,deflate,sdch',
  //       // 'Accept-Language': 'en-US,en;q=0.8'
  //     },
  //     json  : req
  //   }, (err, res, body) => {
      
  //     console.log(JSON.stringify(res));
  
  //     if (err)
  //       console.log(err);
  
  //   });
  // }
  // catch(err) {
  //   console.log('error');
  //   console.log(err);
  // }
}