'use strict';

module.exports = {

  getCategories: function (req, res) {

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

  },

  createCatgory: function (req, res) {
    console.log(req.body);
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
  },

  dagrForCategory: function (req, res) {

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

  },

  attachedDagr: function (req, res) {

    req
      .models
      .dagr
      .get(req.body.dagrId, (err, dagr) => {

        if (err) {
          console.log(err)
          res
            .status(400)
            .send(err);
          return;
        }

        dagr.category_id = req.params.id;
        dagr.save(err => {
          if (err) {
            console.log(err)
            res
              .status(400)
              .send(err)
          } else {
            res.send(dagr)
          }
        })

      })

  },

  removeDagrCategory: function (req, res) {

    req.models.dagr.get(req.body.dagrId, (err, dagr) => {

      dagr.category_id = null;
      dagr.save(err => {
        if (err) {
          console.log(err);
          res.status(400).send(err)
        } else {
          res.send(dagr);
        }
      })

    })

  }

}