const FS          = require('../repository/firestore');
const redisClient = require('../redis/redis_client');

const profileUserRoute = async (app, opt) => {

  app.post('/get-profile', async (req, rep) => {
    
  });

  app.post('/user-supporting-item', async (req, rep) => {
    try {

      let token     = req.body.token.toString().trim();
      let megaID    = req.body.megaID.toString().trim();
      let idItemRm  = parseInt(req.body.idItemRm, 10);

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

module.exports = profileUserRoute;