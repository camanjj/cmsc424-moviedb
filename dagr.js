'use strict';
var scrape = require('html-metadata');


module.exports = {

  getDagrs: function(req, res) {
    req.models.db.driver.execQuery('select * from dagr', (err, result) => {
      if (err) {
        res.status(400).send(err)
      } else {
        res.send(result)
      }
    })
  },

  createDagr: function(req, res) {
    req.models.dagr.create(req.body, (err, result) => {
      if (err) {
        res.status(400).send(err)
      } else {
        res.send(result)
      }
    })
  },

  deleteDagr: function(req, res) {
    req.models.dagr.get(req.params.id, (err, dagr) => {
      dagr.remove((err) => {
        console.log(err)
        res.send(err);
      })

    })
  },

  dagrFromUrl: function(req, res) {
    scrape(req.query.url).then(function(metadata){
      console.log(metadata);
      res.send(metadata)
    });
  },

  dagrBulk: function(req, res) {
    req.models.dagr.create(req.params.dagrs, (err, result) => {
      if (err) {
        res.status(400).send(err)
      } else {
        res.send(result)
      }
    })
  }

}