'use strict';
var scrape = require('html-metadata');
var qOrm = require('q-orm');
const _ = require('underscore')

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
  },

  reachability: function(req, res) {

    const childrenBlock = (list, exclude) => {

      const actionBlock = (dagr) => {
        // console.log(dagr)
        return new Promise((resolve, reject) => {
          req.models.dagr.find({parent_id: dagr.id}, (err, children) => {
            if (!children || children.length == 0) {
              console.log("no children")
              resolve([])
            } else {
              console.log("children")
              console.log(children);
              children = children.filter(val => { if (!exclude) {return true}  return val.id !== exclude.id})
              var mappings = children.map(val => actionBlock(val))
              mappings.push(children)
              resolve(Promise.all(mappings))
            }
          })
        })
      }

      return Promise.all(list.map(val => actionBlock(val)))

    }

    const parentBlock = (root) => {

      const innerBlock = (dagr) => {
      // if there are no parents return nothing
        if (!dagr.parent_id || dagr.parent_id === null) {
          console.log('No parent')
          console.log(dagr.file_name)
          return Promise.all([dagr, childrenBlock([dagr], root)]);
        }

        const parentPromise = new Promise((resolve, reject) => {
          req.models.dagr.get(dagr.parent_id, (err, result) => {
            resolve(innerBlock(result))
          })
        })

        // get the parents resusively, and the current dagr children
        return Promise.all([parentPromise, childrenBlock([dagr], root) ])
      }

      return innerBlock(root)

    }

    req.models.dagr.get(req.body.id, (err, dagr) => {
      
      console.log(err)
      let all = []

      childrenBlock([dagr]).then((children) => {
        all.push(children)
        return parentBlock(dagr)
      }).then((parents) => {
        console.log(parents)
        all.push(parents);
        var graph = _.flatten(all)
        graph = _.uniq(graph, (item) => item.id)

        res.send(graph)
      })

      // Promise.all(childrenBlock([dagr]), parentBlock(dagr)).then((results) => {
      //     let children = _.flatten(results)
      //     console.log(children)
      //     res.send(children)
      //   }).catch(err => {
      //     console.log(err);
      //   })


    })


  }

}