exports.URL_VALID_TOKEN           = 'https://5f51af2d5e98480016123c64.mockapi.io/api/v1/verify-token';

exports.LENGTH_REDIS              = 1;
exports.initLsRedis = () => {
  let lsRedis = [];
  lsRedis.push({
    port  : 6379,
    host  : '127.0.0.1'
  });

  return lsRedis;
}

//--------------------------------data global---------------------------------------
exports.PARTITIONS                = {
  distane_ani_board : 50,
  dura_ani_board    : 0.1,
  dura_knife_fly    : 0.1,
  partition         : 10,
  veloc             : 3000,
  data              : []
}

exports.ARR_ITEM                  = [];
exports.ARR_ID_ITEM_BL            = [];     //danh sách id item dành cho user nằm trong blacklist
exports.BLACK_LIST                = [];