'use strict';

const pool = require('./db/pool')
var express = require('express')
var app = express()


// create the server
let port = (process.env.SERVER_PORT || process.env.PORT || 5000 )

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(port, function () {
  require('./db/migration').migrate();
  console.log('App listening on port %s', port)
})

// just in case we want to add testing
// module.exports = server;
