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
 * 3  -> Share FB
 * 
 * @key target evevnt: đạt đủ target mới được nhận bonus
 * 
 * @key code, status
 * code -> mega_code
 * status -> 1: ok, 0: no
 * 
 * @key RULE_BLOCK_ACC (luật khóa acc user nếu user có tình trạng dò code)
 * RULE_BLOCK_ACC[0]: rule 1
 * RULE_BLOCK_ACC[2]: rule 2
 * 
 * max_failed   -> số lần nhập sai tối đa
 * sequent_time -> nhập sai liên tiếp trong khoảng thời gian này => khóa acc theo rule
 * block_time   -> thời gian acc bị khóa
 */


exports.URL_VALID_TOKEN           = 'http://demo8992960.mockable.io/verify-token';
// exports.URL_VALID_TOKEN           = 'https://mega1vip.mega1.vn/service_gameportal/v1/user/info';
// exports.URL_VALID_TOKEN           = 'https://mega1-gameportal-dev.yeah1group.com/service_gameportal/v1/user/info';
exports.URL_TOPUP                 = 'https://topup-gw-dev-api.yeah1group.com/api/v1/topup';
exports.TAG_TOPUP                 = 'budweiser';
exports.APP_ID_TOPUP              = 'GL5KFS29iJycYRjP';
exports.PRIVATE_KEY_TOPUP         = 'N4OQ2JHouBwJb3ceZedx7gYR/RWYfJhes5DF6Gt64EKYyjG6VZQtD8t1KhmSp+EZ';

exports.LENGTH_REDIS              = 1;
exports.initLsRedis = () => {
  let lsRedis = [];
  lsRedis.push({
    port  : 6379,
    db    : 0,
    host  : '127.0.0.1'
    // host  : '10.235.1.11'
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
};

//--------------------------------data global---------------------------------------
exports.PARTITIONS                = {
  distane_ani_board : 50,
  dura_ani_board    : 0.1,
  dura_knife_fly    : 0.1,
  partition         : 12,
  veloc             : 3000,
  data              : []
};

//fluent logger
exports.TAG_LOGGER                = 'phi-dao-dev';
exports.HOST_LOG                  = '10.10.11.11';
exports.PORT_LOG                  = 24224;

exports.COUNT_DOWN                = '2020-10-30 09:00:00';
exports.TEXT_SHOW                 = {
  text  : 'Phóng Phi Tiêu Rinh Quà Khủng!',
  count : 1
};

exports.TOTAL_PERCENT             = 0;
exports.ARR_ITEM                  = [];
exports.ITEM_FILTER               = [];     //danh sách item có trong list partition
exports.ARR_ID_ITEM_BL            = [];     //danh sách id item dành cho user nằm trong blacklist
exports.ARR_ENTER_CODE            = [];     //danh sách list code. user nhập vào để lấy lượt

exports.BONUS_ENTER_CODE          = {
  bonus_1 : {
    bonus_turn        : 2,
    bonus_lucky_code  : 1
  },
  bonus_2 : {
    bonus_turn        : 5,
    bonus_lucky_code  : 1
  }
};

exports.BLACK_LIST                = [
  {
    mega_code : 'MEGA1179262', status : 0
  }
];

exports.RULE_BLOCK_ACC            = [
  {
    max_failed    : 5,
    sequent_time  : 600000,
    time_block    : 300000,
  },
  {
    max_failed    : 10,
    sequent_time  : 86400000,
    time_block    : 259200000,
  }
];

// exports.NOTIFICATION_BANNER       = [];     //danh sách user trúng được quà với thẻ cào. Dùng để chạy banner thông báo

exports.REGIONS                   = ['Tv', 'Matluot', 'Vtvcab', 'Macohoi', '5Tr', 'Ip11', '15Tr', '10k', '20k', '50k', '100k', '200k', '500k'];

exports.SUPPORTING_ITEM           = [
  {
    id          : 0,
    description : 'Vật Phẩm Bỏ Ô'
  },
  {
    id          : 1,
    description : 'Vật Phẩm Thêm Ô'
  }
];

exports.SPECIAL_ITEM              = [
  {
    id          : 0,
    description : '2 Lượng Vàng PNJ',
    type        : 3,
    region      : 'Vangpnj'
  }
];

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
];

exports.EVENTS                    = {
  start     : '2020-09-30',
  end       : '2020-11-30',
  data      : [
    {
      id            : 0,
      description   : 'x2 Lượt Chơi Khi Nhập Code',
      bonus_turn    : 2,
      target        : 1,
      mul           : 2,                                          // cấp số nhân bonus turn
      sp_item       : null,
      bonus_sp_item : 0,
      status        : 1,
      type          : 0,
      from_date     : '2020-09-29 17:00:00',
      to_date       : '2020-11-29 16:59:59'                       //convert UTC time to localtime
    },
    {
      id            : 1,
      description   : 'Share Game FB',
      bonus_turn    : 1,
      target        : 1,
      sp_item       : null,
      bonus_sp_item : 0,
      status        : 1,
      type          : 3
    }
  ]
};