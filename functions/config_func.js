const FS              = require('../repository/firestore');
const redisClient     = require('../redis/redis_client');

var config;
if (process.env.NODE_ENV === 'production') {
  config = require('../config_pro');
}
else {
  config = require('../config_dev');
}