const dashboardRoute = async (app, opt) => {

  app.get('/', async (req, rep) => {
    rep.view('/partials/dashboard_view.ejs');
  });

}

module.exports = dashboardRoute;