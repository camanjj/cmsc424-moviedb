'use strict';

// const pool = require('./db/pool')
var express = require('express')
var app = express()
var orm = require('orm');
const _ = require('underscore')
var bodyParser = require('body-parser')

const category = require('./category');

app.use(bodyParser.json({type: 'application/*+json'}))

app.use(orm.express(process.env.DATABASE_URL, {
  define: function (db, models, next) {
    models.keyword = db.define("keyword", {name: String})

    models.category = db.define("category", {name: String})
    models
      .category
      .hasOne('parent', models.category)

    models.dagr = db.define("dagr", {
      id: {
        type: 'text',
        length: 32,
        key: true
      },
      file_name: String,
      file_path: String,
      file_type: String,
      file_size: 'integer',
      file_alias: String,
      metadata: Object
    });
    models
      .dagr
      .hasOne('parent', models.dagr)
    // models   .dagr   .hasMany('keywords', models.keyword)
    models
      .dagr
      .hasOne('category', models.category)

    // set the db object for raw queries
    models.db = db

    db.sync()

    next();
  }
}));

// create the server
let port = (process.env.SERVER_PORT || process.env.PORT || 5000)

app.post('/dagr', function (req, res) {

  const dagr = _.pick(req.body, 'dagr')
  const keywords = _.pick(req.body, 'keywords')

})

app.get('/category', category.getCategories)

app.post('/category', category.createCatgory)

app.get('/category/:id/dagr', category.dagrForCategory)

app.post('/category/:id/dagr/:dagrId', category.attachedDagr)

app.listen(port, function () {
  // require('./db/migration').migrate();
  console.log('App listening on port %s', port)
})

// just in case we want to add testing module.exports = server;