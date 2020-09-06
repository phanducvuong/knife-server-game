exports.URL_VALID_TOKEN           = 'https://5f51af2d5e98480016123c64.mockapi.io/api/v1/verify-token';

exports.initLsRedis = () => {
  let lsRedis = [];
  lsRedis.push({
    port  : 6379,
    host  : '127.0.0.1'
  });

  return lsRedis;
}