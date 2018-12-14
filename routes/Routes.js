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
          title: 'Socket.IO Chat Room', 
          message: 'Please login', 
          showLogin: false, 
          showRegistration: false, 
          showSocialLogin: true
        }
    );
  });

  app.get('/auth/github', passport.authenticate('github'));

  app.get('/auth/github/callback', passport.authenticate(
      'github', 
      { failureRedirect: '/' }), 
      (req, res) => { res.redirect('/chat') }
  );

  app.get('/chat', ensureAuthenticated, (req, res) => {
    console.log(req.session);
    res.render('chat', {user: req.user});
  });

  app.get('/profile', ensureAuthenticated, (req, res) => {
      res.render(process.cwd() + '/views/pug/profile', 
          { user: req.user, username: req.user.username }
      );
    });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), 
    (req, res) => { 
        res.redirect('/profile');
    }
  );

  app.post('/register', (req, res, next) => {
    db.collection('users')
      .findOne({ username: req.body.username }, function (err, user) {
        if(err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          var hash = bcrypt.hashSync(req.body.password, 12);

          db.collection('users').insertOne(
              {username: req.body.username, password: hash},
              (err, user) => {
                if(err) {
                  res.redirect('/');
                } else {
                  next(null, user);
                }
          });
        }
    });
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => { res.redirect('/profile') }
  );

  app.use((req, res, next) => {
    res.status(404)
       .type('text')
       .send('Not Found');
  });
}