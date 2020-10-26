exports.response = (rep, status_code, msg) => {
  rep.send({
    status_code : status_code,
    msg         : msg
  });
}