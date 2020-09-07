const dashboardRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    rep.view('/partials/dashboard.ejs');
  });

}

module.exports = dashboardRoute;