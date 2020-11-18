const verifyTokenFunc     = require('../functions/verify_user_func');
const redisClient         = require('../redis/redis_client');
const DS                  = require('../repository/datastore');
const profileFunc         = require('../functions/profile_user_func');
const logger              = require('fluent-logger');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

/**
 * @key actions (lưu lại hoạt động của user để checking mission. return actions to 0 when 23:59:59)
 * index at 0 -> nhập code
 * index at 1 -> phóng phi tiêu
 * 
 * @key events (giống actions. Cứ mỗi lần user nhận bonus thì trừ số lượng event tương ứng)
 * index at 0 -> nhập code
 * index at 1 -> phóng phi tiêu
 * index at 2 -> mời bạn
 * 
 * @key block_acc (lưu lại trạng thái user nhập code sai quá nhiều. Nếu thỏa rule => khóa acc)
 * rule_1: { count: //số lần nhập sai, time: thời gian user bắt đầu nhập sai }
 * rule_2: { count: //số lần nhập sai, time: thời gian user bắt đầu nhập sai }
 * 
 * @field special_item (chứa quà đặc biệt được set ở admin tool)
 * format: {id}_{millisecond}  //id: id của quà được set, millisecond: thời gian user được set quà
 */

const dataInitUser = {
  inven         : [],
  turn          : 0,
  total_turned  : 0,
  token         :'',
  actions       : [0, 0],
  events        : [0, 0, 0],                  //lưu lại số lần nhập code, phóng phi tiêu của user => nhận bonus
  lucky_code    : [],
  sp_item       : [],
  mission       : [],
  date_login    : [],                         //lưu lại ngày đăng nhập (mỗi ngày lưu lại một lần nếu user có vào game ngày hôm đó), (login_date[0] là thời gian user mới đăng nhập lần đầu (newbie))
  log_get_turn  : {                           //lưu lại thời gian và lượt chơi mới sau mỗi lần user làm nhiệm vụ get code hoặc nhập mã code được bonus lượt
    from_mission    : [],                     //format: {id}_{new-turn-user}_{bonus-turn}_{timestamp}
    from_enter_code : []                      //format: {code}_{new-turn-user}_{bonus-turn}_{timestamp}_{lucky-code}
  },
  block_acc     : {
    rule_1      : { count: 0, time: 0 },
    rule_2      : { count: 0, time: 0 }
  },
  special_item  : [],
  phone         : '',
  userID        : '',
  name          : '',
  province      : ''
}

const verifyUserRoute = async (app, opt) => {

  app.post('/verify-user', async (req, rep) => {
    
    try {

      const token     = req.body.token.toString().trim();
      const platform  = req.body.platform;
      const result    = await verifyTokenFunc.verifyTokenUser(token);

      if (result === null || result === undefined || token === null || token === undefined ||
          result.mega1_code === null || result.mega1_code === undefined) {
        throw `unvalid token or undefined mega1_code! ${result}`;
      }

      if (config.PARTITIONS['data'].length !== config.PARTITIONS['partition']) {
        throw `please reload game to update config!`;
      }

      let date     = new Date();
      let dataUser = JSON.parse(await redisClient.getTurnAndInvenUser(`${result.mega1_code}`));
      if (dataUser === null || dataUser === undefined) {
        dataUser = await DS.DSGetDataUser(`${result.mega1_code}`, 'turn_inven');
        if (dataUser === null || dataUser === undefined) {
          dataInitUser.token    = token;
          dataInitUser.phone    = result.phone;
          dataInitUser.userID   = result.user_id;
          dataInitUser.name     = result.name;
          dataInitUser.province = result.province;
          dataUser              = dataInitUser;
        }
        else {
          dataUser.token  = token;
          dataUser.phone  = result.phone;
          dataUser.userID = result.user_id;
          dataUser.name   = result.name;
        }
      }
      else {
        dataUser.token  = token;
        dataUser.name   = result.name;
      }

      if (!verifyTokenFunc.checkDateIsExistIn(date.getTime(), dataUser['date_login'])) {
        dataUser['date_login'].push(date.getTime());
      }

      redisClient.updateTurnAndInvenUser(`${result.mega1_code}`, JSON.stringify(dataUser));
      DS.DSUpdateDataUser(`${result.mega1_code}`, 'turn_inven', dataUser);

      let arrNotifica         = await profileFunc.getNotificaBanner();
      let amountSpItem        = 0;
      let resultAmountSpItem  = profileFunc.getSpItemById(dataUser['sp_item'], 0);
      if (resultAmountSpItem['status']) amountSpItem = resultAmountSpItem['amount'];

      //logger
      logger.emit('log', {
        action  : '[USER][VERIFY-USER]',
        time    : date.toLocaleDateString(),
        detail  : 'user login game',
        data    : { mega_id: result.mega1_code }
      });

      let app_id  = '5f758539deed4200bc1cfe20';
      if (platform === 'ios') {
        app_id  = '5f7585522f638b00cf560e22';
      }

      let dataLog = {
        "advertiser_id": result.user_id,
        "android_id": "",
        "app_code": "",
        "app_id": app_id,
        "app_key": "21d7a592e0845117c8dba8e3bc94e869",
        "app_version": "1.0.0",
        "brand": "",
        "bundle_identifier": "",
        "carrier": "",
        "country_code": "VN",
        "cpu_abi": "",
        "cpu_abi2": "",
        "device": "",
        "device_model": "",
        "device_type": "user",
        "display": "",
        "event_value": { "login_count": 0, "price": 0, "success": true },
        "fcm": "",
        "finger_print": "",
        "install_time": "",
        "language": "Tiếng Việt",
        "last_update_time": "",
        "operator": "",
        "os_version": "",
        "os": platform,
        "platform": platform,
        "product": "",
        "sdk": "23",
        "sdk_version": "1.0.0",
        "server_timestamp": date.getTime(),
        "time_zone": "UTC",
        "timestamp": date.getTime()
      }

      logger.emit('log', {
        action  : '[KPI][GET-SDK]',
        time    : date.toLocaleString(),
        detail  : 'get SDK log',
        data    : {
          "app_id": app_id,
          "app_key": "21d7a592e0845117c8dba8e3bc94e869",
          "data": dataLog,
          "event_type": "1",
          "user_id": result.user_id
        }
      });

      logger.emit('log', {
        action  : '[KPI][GET-SDK]',
        time    : date.toLocaleString(),
        detail  : 'get SDK log',
        data    : {
          "app_id": app_id,
          "app_key": "21d7a592e0845117c8dba8e3bc94e869",
          "data": dataLog,
          "event_type": "2",
          "user_id": result.user_id
        }
      });

      let countDownSplit      = config.COUNT_DOWN.split(' ');
      let countDownSplitDate  = countDownSplit[0].split('-');
      rep.send({
        status_code     : 2000,
        result          : result,
        turn            : dataUser['turn'],
        amount_sp_item  : amountSpItem,
        config          : config.PARTITIONS,
        noti_banner     : arrNotifica,
        count_down      : new Date(config.COUNT_DOWN).getTime(),
        count_down_str  : `${countDownSplit[1]} ${countDownSplitDate[2]}/${countDownSplitDate[1]}/${countDownSplitDate[0]}`,
        text_show       : config.TEXT_SHOW['text'],
        count_text_show : config.TEXT_SHOW['count']
      });

    }
    catch(err) {

      console.log(err);
      rep.send({
        status_code : 3000,
        error       : err
      });

    }

  });

}

module.exports = verifyUserRoute;