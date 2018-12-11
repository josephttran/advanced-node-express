'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const path        = require('path');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// setup template engine
app.set('views', path.join(__dirname, './views/pug'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index', {title: 'Hello', message: 'Please login'});
});

app.listen(process.env.PORT || 3000, () => {
  let port = process.env.PORT ? process.env.PORT : 3000;
  console.log("Listening on port " + port);
});
