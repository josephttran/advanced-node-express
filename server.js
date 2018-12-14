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
const passportSocketIo = require('passport.socketio');
const cookieParser     = require('cookie-parser');
const session          = require('express-session');
const MongoStore       = require('connect-mongo')(session);
const sessionStore     = new MongoStore({url: process.env.DATABASE});

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

    io.use(passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      store: sessionStore
    }));

    io.on('connection', function(socket) {
      console.log(`user ${socket.request.user.name} connected`);
      ++currentUsers;
      io.emit('user', 
          { name: socket.request.user.name, 
            currentUsers, 
            connected: true
          }
      );

      socket.on('chat message', function(msg) {
        io.emit('chat message', { name: socket.request.user.name, message: msg });
      }); 

      socket.on('disconnect', () => {
        console.log(`${socket.request.user.name} has disconnected`);
        --currentUsers;
        io.emit('user', 
            { name: socket.request.user.name, 
              currentUsers, 
              connected: false
            }
        );;
      });

 
    });

    http.listen(process.env.PORT || 3000, () => {
      let port = process.env.PORT ? process.env.PORT : 3000;
      console.log("Listening on port " + port);
    });
  }
});