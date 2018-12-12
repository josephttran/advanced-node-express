const passport = require('passport');
const bcrypt   = require('bcrypt');

module.exports = function(app, db) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  app.get('/', (req, res) => {
    res.render('index', 
        { 
          title: 'Hello', 
          message: 'Please login', 
          showLogin: true, 
          showRegistration: true, 
          showSocialLogin: true
        }
    );
  });

  app.route('/profile')
      .get(ensureAuthenticated, (req, res) => {
      res.render(process.cwd() + '/views/pug/profile', { user: req.user, username: req.user.username});
    });

    app.route('/register')
      .post((req, res, next) => {
          db.collection('users').findOne({ username: req.body.username }, function (err, user) {
              if(err) {
                  next(err);
              } else if (user) {
                  res.redirect('/');
              } else {
                  var hash = bcrypt.hashSync(req.body.password, 12);

                  db.collection('users').insertOne(
                    {username: req.body.username,
                     password: hash},
                    (err, doc) => {
                        if(err) {
                            res.redirect('/');
                        } else {
                            next(null, user);
                        }
                    }
                  )
              }
          })},
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/profile');
        }
    );

    app.post('/login', 
      passport.authenticate('local', { failureRedirect: '/' }), 
      (req, res) => { res.redirect('/profile');}
    );

    app.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });
}