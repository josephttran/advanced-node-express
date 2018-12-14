'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');
const mongo      = require('mongodb').MongoClient;
require('dotenv').config();
const routes     = require('./routes/Routes.js');
const auth       = require('./auth/Auth');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app  = express();
const http = require('http').Server(app);
const io   = require('socket.io')(http);

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

    let currentUsers = 0;
    io.on('connection', function(socket) {
      console.log('A user has connected');
      ++currentUsers;
      io.emit('user count', currentUsers);

      socket.on('disconnect', () => {
        console.log('A user has disconnected');
        --currentUsers;
        io.emit('user count', currentUsers);
      });
    });

    http.listen(process.env.PORT || 3000, () => {
      let port = process.env.PORT ? process.env.PORT : 3000;
      console.log("Listening on port " + port);
    });
  }
});