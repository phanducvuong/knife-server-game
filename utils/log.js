const axios               = require('axios');

const URL_LOG_ADMIN_TOOL  = 'http://13.229.140.173:9880/knife.admin';

exports.logAdminTool = (action, account, data) => {
  let req = {
    action  : action,
    type    : account,
    msg     : JSON.stringify(data),
    source  : ''
  }

  // axios.post(URL_LOG_ADMIN_TOOL, req).then(res => {}).catch(err => {});
}