const passport      = require('passport');
const LocalStrategy = require('passport-local');
const session       = require('express-session');
const ObjectID      = require('mongodb').ObjectID;
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
    done(null, user._id);
  })

  passport.deserializeUser((id, done) => {
    db.collection('users').findOne(
      {_id: new ObjectID(id)}, 
      (err, doc) => {
        done(null, doc)
      }
    );
  })
 
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