/**
 * @key type in items
 * 0 -> quà
 * 1 -> thẻ cào
 * 2 -> mã cơ hội
 * 
 * @key status
 * 0 -> hidden
 * 1 -> show
 * 
 * @key type mission/event: check action user
 * -1 -> NONE
 * 0  -> Nhập Code
 * 1  -> Phóng Phi Tiêu
 * 2  -> Mời Bạn
 * 
 * @key code, status
 * code -> mega_code
 * status -> 1: ok, 0: no
 */


exports.URL_VALID_TOKEN           = 'http://demo8992960.mockable.io/verify-token';
// exports.URL_VALID_TOKEN           = 'http://mega1-gameportal-dev.yeah1group.com/service_gameportal/v1/user/info';
exports.URL_TOPUP                 = 'https://topup-gw-dev-api.yeah1group.com/api/v1/topup';
exports.APP_ID_TOPUP              = 'jEaTJp4FauQWLOl0';
exports.PRIVATE_KEY_TOPUP         = '1x9T7QlA5MWu9RPHaREeK7+5ynABS7ShlF43urYudeYStGgWmYJTYcU8IhFBwg2z';

exports.LENGTH_REDIS              = 1;
exports.initLsRedis = () => {
  let lsRedis = [];
  lsRedis.push({
    port  : 6379,
    // host  : '10.235.1.11'
    host  : '127.0.0.1'
    // host  : '54.151.144.72'
  });

  /**add redis config in here
   * lsRedis.push({
   *  port  : //port redis,
   *  host  : //host redis
   * })
   */

  this.LENGTH_REDIS = lsRedis.length;
  return lsRedis;
}

//--------------------------------data global---------------------------------------
exports.PARTITIONS                = {
  distane_ani_board : 50,
  dura_ani_board    : 0.1,
  dura_knife_fly    : 0.1,
  partition         : 12,
  veloc             : 3000,
  data              : []
}

//fluent logger
exports.TAG_LOGGER                = 'phi-dao-dev';
exports.HOST_LOG                  = '10.10.11.11';
exports.PORT_LOG                  = 24224;

exports.TOTAL_PERCENT             = 0;
exports.ARR_ITEM                  = [];
exports.ITEM_FILTER               = [];     //danh sách item có trong list partition
exports.ARR_ID_ITEM_BL            = [];     //danh sách id item dành cho user nằm trong blacklist
exports.ARR_ENTER_CODE            = [];     //danh sách list code. user nhập vào để lấy lượt

exports.BLACK_LIST                = [
  {
    mega_code : 'MEGA1179262', status : 0
  }
];

// exports.NOTIFICATION_BANNER       = [];     //danh sách user trúng được quà với thẻ cào. Dùng để chạy banner thông báo

exports.REGIONS                   = ['Tv', 'Matluot', 'Macohoi', '5Tr', 'Ip11', '15Tr', '10k', '20k', '50k', '100k', '200k', '500k'];

exports.SUPPORTING_ITEM           = [
  {
    id          : 0,
    description : 'Vật Phẩm Bỏ Ô'
  },
  {
    id          : 1,
    description : 'Vật Phẩm Thêm Ô'
  }
]

exports.MISSIONS                  = [
  {
    id            : 0,
    description   : 'Share Game FB',
    bonus_turn    : 1,
    target        : 0,
    sp_item       : this.SUPPORTING_ITEM[0],
    bonus_sp_item : 1,
    status        : 1,
    type          : -1
  }
]

exports.EVENTS                    = {
  start     : '2020-09-30',
  end       : '2020-10-30',
  data      : [
    {
      id            : 0,
      description   : 'x2 Lượt Chơi Khi Nhập Code',
      bonus_turn    : 2,
      target        : 1,
      sp_item       : null,
      bonus_sp_item : 0,
      status        : 1,
      type          : 0
    }
  ]
}