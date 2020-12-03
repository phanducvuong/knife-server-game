const fastify     = require('fastify');
const app         = fastify({ logger: false });
const logger      = require('fluent-logger');
const path        = require('path');
const schedule    = require('./utils/schedule');

var config;
if (process.env.NODE_ENV === "production") {
  config          = require('./config_prod');
}
else {
  config          = require('./config_dev');
}

let versionCode   = 1;
app.register(require('fastify-cors'));

app.get('/loader.io', async (req, rep) => {
  rep.send('loader.io');
});

app.get('/version', async (req, rep) => {
  rep.send({
    version: versionCode
  });
});

app.get('/', async (req, rep) => {
  rep.send('welcome to my app!');
});

//config fluent-logger
logger.configure(config.TAG_LOGGER, {
  host              : config.HOST_LOG,
  port              : config.PORT_LOG,
  timeout           : 3.0,
  reconnectInterval : 600000
});

app.register(require('fastify-formbody'));
app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    let json = JSON.parse(body);
    done(null, json);
  }
  catch(err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

app.register(require('point-of-view'), {
  engine: { 
    ejs: require('ejs')
  },
  templates: './admin/views'
});

app.register(require('fastify-static'), {
  root    : path.join(__dirname, './admin/public'),
  prefix  : '/public/',                                     // optional: default '/'
});

app.register(require('./routes/verify_user_route'),       { prefix: '/api/v1/user' });
app.register(require('./routes/wheel_route'),             { prefix: '/api/v1/wheel' });
app.register(require('./routes/mission_route'),           { prefix: '/api/v1/mission' });
app.register(require('./routes/event_route'),             { prefix: '/api/v1/event' });
app.register(require('./routes/profile_user_route'),      { prefix: '/api/v1/profile' });

//route admin
app.register(require('./admin/route/dashboard_route'),    { prefix: '/api/v1/admin/dashboard' });
app.register(require('./admin/route/setup_route'),        { prefix: '/api/v1/admin/setup' });
app.register(require('./admin/route/item_route'),         { prefix: '/api/v1/admin/item' });
app.register(require('./admin/route/user_info_route'),    { prefix: '/api/v1/admin/user-info' });
app.register(require('./admin/route/check_code_route'),   { prefix: '/api/v1/admin/code' });
app.register(require('./admin/route/signin_route'),       { prefix: '/api/v1/admin/signin' });
app.register(require('./admin/route/unlock_user_route'),  { prefix: '/api/v1/admin/unlock' });
app.register(require('./admin/route/role_route'),         { prefix: '/api/v1/admin/role' });
app.register(require('./admin/route/lucky_code_route'),   { prefix: '/api/v1/admin/lucky-code' });

//route test
app.register(require('./test/global_route'),              { prefix: '/api/v1/test' });

//schedule
schedule.scheResetDataUser();
schedule.scheDataGlobal();

// readCode.ReadCode('./budweiser_hash_code.txt');

schedule.updatePartition()
        .then(() => {
          const PORT = process.env.PORT || 3000;
          app.listen(PORT, '0.0.0.0', async (err, address) => {
          
            console.log(`app listening on port ${PORT}`);
            if (err) {
              console.log(err);
              process.exit(1);
            }
          });
        });