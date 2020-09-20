const FS          = require('../repository/firestore');
const redisClient = require('../redis/redis_client');

const profileUserRoute = async (app, opt) => {

  app.post('/get-profile', async (req, rep) => {
    
  });

}

module.exports = profileUserRoute;