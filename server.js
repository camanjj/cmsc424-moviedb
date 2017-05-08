'use strict';

// const pool = require('./db/pool')
var express = require('express')
var app = express()
var orm = require('orm');
const _ = require('underscore')

app.use(orm.express(process.env.DATABASE_URL, {
  define: function (db, models, next) {
    models.keyword = db.define("keyword", {name: String})
    models.dagr = db.define("dagr", {
      gid: String,
      file_name: String,
      file_path: String,
      file_type: String,
      file_size: Int,
      file_alias: String,
      metadata: Object
    });
    models
      .dagr
      .hasOne('parent', models.dagr)
    models
      .dagr
      .hasMany('keywords', models.keyword)

    models.category = db.define("category", {name: String})
    models
      .category
      .hasOne('parent', models.category)

    next();
  }
}));

// create the server
let port = (process.env.SERVER_PORT || process.env.PORT || 5000)

app.post('/dagr', function (req, res) {
  
  const dagr = _.pick(req.body, 'dagr')
  const keywords = _.pick(req.body, 'keywords')

})

app.listen(port, function () {
  // require('./db/migration').migrate();
  console.log('App listening on port %s', port)
})

// just in case we want to add testing module.exports = server;