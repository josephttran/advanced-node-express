'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const path        = require('path');
const passport    = require('passport');
const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const ObjectID    = require('mongodb').ObjectID;
require('dotenv').config();
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// setup session and passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
// setup template engine
app.set('views', path.join(__dirname, './views/pug'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index', {title: 'Hello', message: 'Please login'});
});

mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, db) => {
  if (err) {
    console.log(`Database error: ${err}`);
  } else {
    console.log('Successful database connection');

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

    app.listen(process.env.PORT || 3000, () => {
      let port = process.env.PORT ? process.env.PORT : 3000;
      console.log("Listening on port " + port);
    });
  }
});

