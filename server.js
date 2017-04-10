'use strict';

var express = require('express')
var app = express()


// create the server
let port = (process.env.SERVER_PORT || process.env.PORT || 5000 )

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(port, function () {
  console.log('Example app listening on port 3000!')
})

// just in case we want to add testing
module.exports = server;
