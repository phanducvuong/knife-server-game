exports.URL_VALID_TOKEN           = 'http://demo8992960.mockable.io/verify-token';

exports.LENGTH_REDIS              = 1;
exports.initLsRedis = () => {
  let lsRedis = [];
  lsRedis.push({
    port  : 6379,
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

/**
 * @param type in items
 * 0 -> quà
 * 1 -> thẻ cào
 * 
 * 0 -> hidden
 * 1 -> show
 */

exports.TOTAL_PERCENT             = 0;
exports.ARR_ITEM                  = [];
exports.ITEM_FILTER               = [];     //danh sách item có trong list partition
exports.ARR_ID_ITEM_BL            = [];     //danh sách id item dành cho user nằm trong blacklist
exports.BLACK_LIST                = [];

exports.REGIONS                   = ['Tv', 'Matluot', 'Macohoi', '5Tr', 'Ip11', '15Tr', '10k', '20k', '50k', '100k', '200k', '500k'];

exports.SUPPORTING_ITEM           = [
  {
    id          : 0,
    description : 'Vật Phẩm Bỏ Ô',
    bonus       : 1
  },
  {
    id          : 1,
    description : 'Vật Phẩm Thêm Ô',
    bonus       : 1
  }
]

exports.MISSIONS                  = [
  {
    id          : 0,
    description : 'Đăng Nhập Vào Game Mỗi Ngày',
    bonus       : 1,
    id_sp_item  : null,
    status      : 1
  },
  {
    id          : 1,
    description : 'Mời 5 Bạn Mới Thành Công',
    bonus       : -1,
    id_sp_item  : 0,
    status      : 1
  },
  {
    id          : 2,
    description : 'Mời 2 Bạn Mới Thành Công',
    bonus       : -1,
    id_sp_item  : 1,
    status      : 1
  },
  {
    id          : 3,
    description : 'ABC',
    bonus       : 1,
    id_sp_item  : null,
    status      : 1
  },
  {
    id          : 4,
    description : 'DEF',
    bonus       : 1,
    id_sp_item  : null,
    status      : 1
  },
  {
    id          : 5,
    description : 'GHI Event',
    bonus       : 1,
    id_sp_item  : 1,
    status      : 1
  },
  {
    id          : 6,
    description : 'JKL Event',
    bonus       : 1,
    id_sp_item  : 1,
    status      : 1
  },
  {
    id          : 7,
    description : 'MNO Event',
    bonus       : 1,
    id_sp_item  : null,
    status      : 1
  },
  {
    id          : 8,
    description : 'PQRS Event',
    bonus       : 1,
    id_sp_item  : null,
    status      : 1
  }
]

exports.EVENTS                    = {
  start     : '2020-09-30',
  end       : '2020-10-30',
  data      : [
    {
      id          : 0,
      description : 'ABC Event',
      bonus       : 1,
      id_sp_item  : null,
      status      : 1
    },
    {
      id          : 1,
      description : 'DEF Event',
      bonus       : 1,
      id_sp_item  : 0,
      status      : 1
    },
    {
      id          : 0,
      description : 'GHI Event',
      bonus       : 1,
      id_sp_item  : null,
      status      : 1
    },
    {
      id          : 1,
      description : 'JKL Event',
      bonus       : 1,
      id_sp_item  : 0,
      status      : 1
    }
  ]
}