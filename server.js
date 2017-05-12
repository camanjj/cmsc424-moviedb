'use strict';

// const pool = require('./db/pool')
var express = require('express')
var app = express()
var cors = require('cors')
var orm = require('orm');
const _ = require('underscore')
var bodyParser = require('body-parser')

const category = require('./category');
const dagr = require('./dagr')

app.use(bodyParser.json({type: '*/*'}))
app.use(cors())

app.use(orm.express(process.env.DATABASE_URL, {
  define: function (db, models, next) {
    models.keyword = db.define("keyword", {name: String})

    models.category = db.define("category", {name: String})
    models
      .category
      .hasOne('parent', models.category)

    models.dagr = db.define("dagr", {
      id: {type:'text', size: 32, key:true},
      file_name: String,
      creator: String,
      created: Date,
      modified: Date,
      path: String,
      file_type: String,
      file_size: 'integer',
      file_alias: String,
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


// category endpoints
app.get('/category', category.getCategories);
app.post('/category', category.createCatgory);
app.get('/category/:id/dagr', category.dagrForCategory);
app.post('/category/:id/dagr', category.attachedDagr);
app.post('/category/dagr/remove', category.removeDagrCategory)

// dagr endpoints
app.get('/dagr', dagr.getDagrs);
app.post('/dagr', dagr.createDagr);
app.get('/dagr/link', dagr.dagrFromUrl);
app.post('/dagr/delete', dagr.deleteDagr);
app.post('/dagrs', dagr.dagrBulk);
app.post('/dagr/reach', dagr.reachability);
app.post('/dagr/query', dagr.queryDagrs)
app.get('/dagr/orphans', dagr.sterileQuery)

app.listen(port, function () {
  // require('./db/migration').migrate();
  console.log('App listening on port %s', port)
})

// just in case we want to add testing module.exports = server;