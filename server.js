'use strict';

// const pool = require('./db/pool')
var express = require('express')
var app = express()
var orm = require('orm');
const _ = require('underscore')
var bodyParser = require('body-parser')

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

app.get('/category', function (req, res) {

  req
    .models
    .db
    .driver
    .execQuery('select * from category', (err, result) => {

      if (err) {
        res
          .status(400)
          .send(err);
      } else {
        res.send(result);
      }

    })

})

app.post('/category', (req, res) => {

  req
    .models
    .category
    .create(req.body, (err, result) => {
      if (err) {
        res.send(400, err);
      } else {
        res.send(result)
      }
    })
})

app.get('/category/:id/dagr', (req, res) => {

  req
    .models
    .db
    .driver
    .execQuery("select * from dagr where category_id = ?", [req.params.id], (err, result) => {
      if (err) {
        res
          .status(400)
          .send(err);
      } else {
        res.send(result);
      }
    })

})

app.post('/category/:id/dagr/:dagrId', (req, res) => {

  req
    .models
    .dagr
    .get(req.params.dagrId, (err, dagr) => {

      if (err) {
        res
          .status(400)
          .send(err);
        return;
      }

      dagr.category_id = id;
      dagr.save(err => {
        if (err) {
          res
            .status(400)
            .send(err)
        } else {
          res.send(dagr)
        }
      })

    })

})

app.listen(port, function () {
  // require('./db/migration').migrate();
  console.log('App listening on port %s', port)
})

// just in case we want to add testing module.exports = server;