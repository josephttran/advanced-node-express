'use strict';

const express       = require('express');
const bodyParser    = require('body-parser');
const path          = require('path');
const mongo         = require('mongodb').MongoClient;
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
