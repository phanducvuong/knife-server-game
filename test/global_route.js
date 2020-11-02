const DS            = require('../repository/datastore');
const redisClient   = require('../redis/redis_client');
const strGenerate   = require('../utils/generate_string');
const profileFunc   = require('../functions/profile_user_func');
const util          = require('../utils/util');
const logger        = require('fluent-logger');
const sendMail      = require('../utils/send_mail');
const topup         = require('../repository/topup');
const ReverseMd5    = require('reverse-md5');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_prod');
}
else {
  config = require('../config_dev');
}

const dataInitUser = {
  inven         : [],
  turn          : 0,
  total_turned  : 0,
  token         :'',
  actions       : [0, 0],
  events        : [0, 0, 0],
  lucky_code    : [],
  sp_item       : [],
  mission       : [],
  date_login    : [],                         //lưu lại ngày đăng nhập (mỗi ngày lưu lại một lần nếu user có vào game ngày hôm đó),
  log_get_turn  : {                           //lưu lại thời gian và lượt chơi mới sau mỗi lần user làm nhiệm vụ get code hoặc nhập mã code được bonus lượt
    from_mission    : [],
    from_enter_code : []
  },
  phone         : '',
  userID        : '',
  name          : ''
}

const lsItem        = [
  {
      "type": -1,
      "save": true,
      "id": 0,
      "amount": 10,
      "maximum": -1,
      "name": "Mất Lượt",
      "special_item": false,
      "percent": 1000
  },
  {
      "type": 2,
      "save": true,
      "id": 1,
      "amount": 19,
      "name": "Mã Cơ Hội",
      "maximum": -1,
      "special_item": false,
      "percent": 15000000
  },
  {
      "maximum": 1500,
      "name": "5 Triệu",
      "percent": 1000,
      "id": 10,
      "special_item": false,
      "save": true,
      "type": 0,
      "amount": 13
  },
  {
      "name": "15 Triệu",
      "special_item": false,
      "percent": 1000,
      "id": 11,
      "maximum": 1500,
      "amount": 12,
      "save": true,
      "type": 0
  },
  {
      "id": 2,
      "special_item": false,
      "type": 1,
      "amount": 11,
      "name": "Thẻ Cào 10K",
      "save": true,
      "maximum": 1500,
      "percent": 1000
  },
  {
      "type": 1,
      "maximum": 1500,
      "name": "Thẻ Cào 20K",
      "percent": 1000,
      "save": true,
      "special_item": false,
      "id": 3,
      "amount": 14
  },
  {
      "maximum": 1500,
      "amount": 11,
      "save": true,
      "type": 1,
      "name": "Thẻ Cào 50K",
      "id": 4,
      "special_item": false,
      "percent": 1000
  },
  {
      "special_item": false,
      "percent": 1000,
      "amount": 10,
      "type": 1,
      "save": true,
      "id": 5,
      "name": "Thẻ Cào 100K",
      "maximum": 1500
  },
  {
      "amount": 15,
      "percent": 1000,
      "special_item": false,
      "id": 6,
      "maximum": 1500,
      "name": "Thẻ Cào 200K",
      "type": 1,
      "save": true
  },
  {
      "save": true,
      "id": 7,
      "percent": 1000,
      "amount": 11,
      "name": "Thẻ Cào 500K",
      "special_item": false,
      "maximum": 1500,
      "type": 1
  },
  {
      "name": "Tivi",
      "amount": 17,
      "id": 8,
      "save": true,
      "type": 0,
      "special_item": false,
      "maximum": 1500,
      "percent": 1000
  },
  {
      "amount": 43,
      "type": 0,
      "name": "Iphone 11",
      "percent": 1000,
      "maximum": 1500,
      "id": 9,
      "save": true,
      "special_item": false
  }
]

const partition     = {
  "distane_ani_board": 50,
  "veloc": 5000,
  "dura_ani_board": 0.1,
  "partition": 20,
  "dura_knife_fly": 0.1,
  "data": [
    {
      "pos": 0,
      "region": "Matluot",
      "name": "Mất Lượt",
      "id": 0
    },
    {
      "id": 8,
      "name": "Tivi",
      "region": "Tv",
      "pos": 1
    },
    {
      "id": 2,
      "name": "Thẻ Cào 10K",
      "region": "10k",
      "pos": 2
    },
    {
      "name": "Thẻ Cào 20K",
      "region": "20k",
      "pos": 3,
      "id": 3
    },
    {
      "region": "50k",
      "id": 4,
      "pos": 4,
      "name": "Thẻ Cào 50K"
    },
    {
      "name": "5 Triệu",
      "id": 10,
      "pos": 5,
      "region": "5Tr"
    },
    {
      "name": "Thẻ Cào 500K",
      "pos": 6,
      "id": 7,
      "region": "500k"
    },
    {
      "region": "200k",
      "name": "Thẻ Cào 200K",
      "id": 6,
      "pos": 11
    },
    {
      "region": "15Tr",
      "name": "15 Triệu",
      "pos": 8,
      "id": 11
    },
    {
      "region": "Ip11",
      "id": 9,
      "name": "Iphone 11",
      "pos": 12
    },
    {
      "region": "20k",
      "id": 3,
      "pos": 9,
      "name": "Thẻ Cào 20K"
    },
    {
      "pos": 13,
      "region": "Macohoi",
      "name": "Mã Cơ Hội",
      "id": 1
    },
    {
      "id": 2,
      "region": "10k",
      "pos": 14,
      "name": "Thẻ Cào 10K"
    },
    {
      "name": "Tivi",
      "id": 8,
      "pos": 15,
      "region": "Tv"
    },
    {
      "id": 6,
      "region": "200k",
      "pos": 16,
      "name": "Thẻ Cào 200K"
    },
    {
      "pos": 17,
      "id": 0,
      "region": "Matluot",
      "name": "Mất Lượt"
    },
    {
      "pos": 18,
      "id": 5,
      "region": "100k",
      "name": "Thẻ Cào 100K"
    },
    {
      "region": "15Tr",
      "id": 11,
      "pos": 19,
      "name": "15 Triệu"
    },
    {
      "id": 3,
      "region": "20k",
      "pos": 10,
      "name": "Thẻ Cào 20K"
    },
    {
      "id": 4,
      "name": "Thẻ Cào 50K",
      "region": "50k",
      "pos": 7
    }
  ],
}

const globalRoute = async (app, opt) => {

  app.get('/quickly-config', async (req, rep) => {
    if (process.env.NODE_ENV !== 'dev') {
      rep.send('Failed!');
      return;
    }

    for (i of lsItem) {
      redisClient.initItemBy(i['id']);
      DS.DSUpdateDataGlobal('items', i['id'], i);
    }
    DS.DSUpdateDataGlobal('admin', 'partitions', partition);
    rep.send('ok');
  });

  app.post('/init-user', async (req, rep) => {

    if (process.env.NODE_ENV !== 'dev') {
      rep.send('Failed!');
      return;
    }

    let megaID  = req.body.megaID;
    let name    = req.body.name;
    let userID  = req.body.userID;
    
    dataInitUser.turn   = 2000;
    dataInitUser.name   = name;
    dataInitUser.userID = userID;
    dataInitUser.token  = '123456';

    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataInitUser));
    DS.DSUpdateDataGlobal(megaID, 'turn_inven', dataInitUser);
    rep.send('ok');

  });

  app.get('/get-black-list', async (req, rep) => {
    rep.send(config.BLACK_LIST);
  });

  app.get('/partition', async (req, rep) => {
    rep.send(config.PARTITIONS);
  });

  app.get('/get-all-item', async (req, rep) => {
    rep.send(config.ARR_ITEM);
  });

  app.get('/get-filter-item', async (req, rep) => {
    rep.send(config.ITEM_FILTER);
  });

  app.get('/get-partitiion', async (req, rep) => {
    rep.send(config.PARTITIONS);
  });

  app.get('/get-mission', async (req, rep) => {
    rep.send(config.MISSIONS);
  });

  app.get('/get-config', async (req, rep) => {
    rep.send({
      total_percent : config.TOTAL_PERCENT,
      size          : config.ITEM_FILTER.length,
      item_filter   : config.ITEM_FILTER
    });
  });

  app.get('/get-supporting-item', async (req, rep) => {
    rep.send(config.SUPPORTING_ITEM);
  });

  app.post('/set-turn-user', async (req, rep) => {
    if (process.env.NODE_ENV !== 'dev') {
      rep.send('Failed!');
      return;
    }

    const megaID  = req.body.megaID;
    const turn    = req.body.turn;

    let dataUser      = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
    dataUser['turn']  = turn;

    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

    rep.send('success');

  });

  app.post('/empty-mission', async (req, rep) => {
    if (process.env.NODE_ENV !== 'dev') {
      rep.send('Failed!');
      return;
    }

    let megaID          = req.body.megaID;
    let dataUser        = JSON.parse(await redisClient.getTurnAndInvenUser(megaID));
    dataUser['mission'] = [];

    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

    rep.send('ok');
  });

  app.post('/update-sp-item', async (req, rep) => {
    if (process.env.NODE_ENV !== 'dev') {
      rep.send('Failed!');
      return;
    }

    let megaID    = req.body.megaID;
    let idSpItem  = req.body.idSpItem;
    let amount    = req.body.amount;
    let dataUser  = await DS.DSGetDataUser(megaID, 'turn_inven');

    for (let i=0; i<dataUser['sp_item'].length; i++) {
      let tmpStr = dataUser['sp_item'][i].split('_');
      if (tmpStr[0] === idSpItem) {
        tmpStr[1] = amount;
        dataUser['sp_item'][i] = `${tmpStr[0]}_${tmpStr[1]}`;
        break;
      }
    }

    redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));
    DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);

    rep.send('ok');
  });

  app.get('/notifica-banner', async (req, rep) => {
    let data = await profileFunc.getNotificaBanner();
    rep.send(data);
  });

  app.post('/reset-event-user', async (req, rep) => {
    try {

      if (process.env.NODE_ENV !== 'dev') throw 'Failed!';

      let megaID    = req.body.megaID.toString().trim();
      let dataUser  = await DS.DSGetDataUser(megaID, 'turn_inven');
      
      if (dataUser === null || dataUser === undefined) throw `User not exist!`;
      dataUser['events'][0]   = 0;
      dataUser['events'][1]   = 0;
      dataUser['events'][2]   = 0;

      dataUser['actions'][0]  = 0;
      dataUser['actions'][1]  = 0;

      DS.DSUpdateDataUser(megaID, 'turn_inven', dataUser);
      redisClient.updateTurnAndInvenUser(megaID, JSON.stringify(dataUser));

      rep.send({
        status_code : 2000,
        msg         : 'success'
      });

    }
    catch(err) {

      rep.send({
        status_code : 3000,
        error       : err
      });

    }
  });

  app.get('/get-black-lists', async (req, rep) => {
    rep.send(config.BLACK_LIST);
  });

  app.post('/libgdx', async (req, rep) => {
    let name  = req.body.name;
    let age   = req.body.age;

    console.log(`name: ${name}   age: ${age}`);
    rep.send('ok');
  });

  // app.get('/gen-random-string', async (req, rep) => {
  //   const hrtime1        = process.hrtime();
  //   const hrtime2        = process.hrtime();
  //   let str1 = strGenerate.getStringGenerate(hrtime1);
  //   let str2 = strGenerate.getStringGenerate(hrtime2);
  //   rep.send(`${str1}\n${str2}`);
  // });

  app.post('/hash-code', async (req, rep) => {
    let codes   = req.body.codes;
    let arrCode = [];
    
    for (c of codes) {
      let resultHash = util.genEnterCode(c);
      arrCode.push({
        code_hash   : resultHash,
        code        : c,
        used        : 0
      });
    }

    DS.DSUpdateDataGlobal('admin', 'enter_code', { codes: arrCode });
    rep.send(arrCode);
  });

  app.get('/test-log', async (req, rep) => {
    //logger
    logger.emit('log', {
      action  : '[TEST][TEST-LOG]',
      time    : new Date().toLocaleString(),
      detail  : 'test-log',
      data    : {
        log   : 'test log'
      }
    });
    rep.send('ok');
  });

  app.get('/send-mail', async (req, rep) => {
    sendMail.sendTokenForMailer('abcbs', 'vuong.phan1269@gmail.com');
    rep.send('ok');
  });

  app.get('/flushall', async (req, rep) => {
    redisClient.flushall();
    rep.send('ok');
  });

  app.post('/test-topup', async (req, rep) => {
    let teleCard  = parseInt(req.body.tele_card, 10);
    let megaID    = req.body.megaID;
    let phone     = req.body.phone;
    
    topup.requestTopupCardPhone(teleCard, phone, megaID);
    rep.send('ok');
  });

  app.post('/topup', async (req, rep) => {
    let teleCard  = parseInt(req.body.tele_card, 10);
    let megaID    = req.body.megaID;
    let phone     = req.body.phone;
    
    let result = await topup.requestTopupCardPhoneTEST(teleCard, phone, megaID);
    rep.send(result);
  });

  app.post('/reverse-md5', (req, rep) => {
    let s = req.body.md5;
    var reverseMd5 = ReverseMd5({
      lettersUpper: true,
      lettersLower: true,
      numbers: true,
      special: true,
      whitespace: true,
      maxLen: 30
    });
    let a = reverseMd5(s);
    rep.send(a);
  });

}

module.exports = globalRoute;