const session       = require('express-session');
const passport      = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy
const bcrypt        = require('bcrypt');

module.exports = function(app, db) {
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  })

  passport.deserializeUser((id, done) => {
    db.collection('socialusers').findOne(
      {id: id}, 
      (err, doc) => {
        done(null, doc)
      }
    );
  })

  passport.use(new GitHubStrategy(
    {clientID: process.env.GITHUB_CLIENT_ID,
     clientSecret: process.env.GITHUB_CLIENT_SECRET,
     callbackURL: process.env.CALLBACK_URL
    },
    function(accessToken, refreshToken, profile, cb) {
      db.collection('socialusers').findAndModify(
        {id: profile.id},
        {},
        {$setOnInsert:{
            id: profile.id,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: profile.emails || 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
        },$set:{
            last_login: new Date()
        },$inc:{
            login_count: 1
        }},
        {upsert:true, new: true},
        (err, doc) => {
            return cb(null, doc.value);
        }
      );
    }
  ));
 
  passport.use(new LocalStrategy(
    function(username, password, done) {
      db.collection('users').findOne({ username: username }, function (err, user) {
        console.log(`User ${username} attempted to log in.`);
        if (err) return done(err);
        if (!user) return done(null, false, );
        if (!bcrypt.compareSync(password, user.password)) return done(null, false);
        return done(null, user);
      });
    })
  );  
}