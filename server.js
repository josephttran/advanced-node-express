'use strict';

const express        = require('express');
const bodyParser     = require('body-parser');
const path           = require('path');
const mongo          = require('mongodb').MongoClient;
const passport       = require('passport');
const GitHubStrategy = require('passport-github').Strategy
require('dotenv').config();
const routes     = require('./Routes.js');
const auth       = require('./auth/Auth');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// setup template engine
app.set('views', path.join(__dirname, './views/pug'));
app.set('view engine', 'pug');

mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    console.log(`Database error: ${err}`);
  } else {
    console.log('Successful database connection');

    const db = client.db(process.env.DBName);

    auth(app, db);

    passport.use(new GitHubStrategy(
      {clientID: process.env.GITHUB_CLIENT_ID,
       clientSecret: process.env.GITHUB_CLIENT_SECRET,
       callbackURL: 'http://127.0.0.1:3000/auth/github/callback'
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
  
    app.route('/auth/github')
      .get(passport.authenticate('github'));

    app.route('/auth/github/callback')
      .get(passport.authenticate('github', { failureRedirect: '/' }), 
          (req, res) => {
            res.redirect('/profile');    // Successful authentication, redirect profile.
          }
      );

    routes(app, db);

    app.use((req, res, next) => {
      res.status(404)
         .type('text')
         .send('Not Found');
    });

    app.listen(process.env.PORT || 3000, () => {
      let port = process.env.PORT ? process.env.PORT : 3000;
      console.log("Listening on port " + port);
    });
  }
});
