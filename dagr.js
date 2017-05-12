'use strict';
var scrape = require('html-metadata');
var qOrm = require('q-orm');
const _ = require('underscore')
const moment = require('moment')
const guid = require('guid')
const request = require('request')

const reachability = (req, dagr) => {

    const childrenBlock = (list, exclude) => {

      const actionBlock = (dagr) => {
        // console.log(dagr)
        return new Promise((resolve, reject) => {
          req.models.dagr.find({parent_id: dagr.id}, (err, children) => {
            if (!children || children.length == 0) {
              resolve([])
            } else {
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
          let d = [childrenBlock([dagr], root)]
          if (dagr.id !== root.id) d.push(dagr)
          return Promise.all(d);
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
    var all = []
    return childrenBlock([dagr]).then((children) => {
        all.push(children)
        return parentBlock(dagr)
      }).then((parents) => {
        all.push(parents);
        var graph = _.flatten(all)
        graph = _.uniq(graph, (item) => item.id)

        return Promise.resolve(graph)
      })
  
}

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
    req.models.dagr.get(req.body.id, (err, dagr) => {
      dagr.remove((err) => {
        if (err) {
        res.status(400).send(err)
      } else {
        res.status(204).send()
      }
      })

    })
  },

  dagrFromUrl: function(req, res) {

    let requestPromise = new Promise((resolve, reject) => {

      request(req.query.url, (error, response, body) => {
        resolve(response)
      })


    })

    Promise.all([scrape(req.query.url), requestPromise]).then(function(data){
      
      const [metadata, response] = data;
      // const {error, response, body = r
      // console.log(response)
      const dagr = {
        id: guid.create().value,
        file_name: metadata.general.title,
        creator: metadata.jsonLd.creator[0] || "",
        created: moment(metadata.jsonLd.datePublished || null).toDate(),
        modified: moment(metadata.jsonLd.dateModified || null).toDate(),
        path: req.query.url,
        file_type: 'html',
        file_size: parseInt(response.headers['content-length']) || 0
      }
      
      req.models.dagr.create(dagr, (err, result) => {
        if (err) {
          res.status(400).send(err)
          return;
        }

        res.send(result)
      })

      // res.send(metadata)
    });
  },

  dagrBulk: function(req, res) {
    req.models.dagr.create(req.body, (err, result) => {
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

      reachability(req, dagr).then((result) => {
        res.send(result)
      })

      // childrenBlock([dagr]).then((children) => {
      //   all.push(children)
      //   return parentBlock(dagr)
      // }).then((parents) => {
      //   console.log(parents)
      //   all.push(parents);
      //   var graph = _.flatten(all)
      //   graph = _.uniq(graph, (item) => item.id)

      //   res.send(graph)
      // })

    })


  },

  queryDagrs: function(req, res) {

    const queryData = req.body
    var constraints = []
    console.log(queryData)

    // handle the created date constraints
    if (queryData.created) {
      if (_.has(queryData.created, 'after') && queryData.created.after) {
        constraints.push(`created >= '${moment(queryData.created.after).format("YYYY-MM-DD HH:mm:ss")}'`)
      }
      if (_.has(queryData.created,'before') && queryData.created.before) {
        constraints.push(`created <= '${moment(queryData.created.before).format("YYYY-MM-DD HH:mm:ss")}'`)
      }
    }

    // handle the modified date constraints
    if (queryData.modified) {
      if (_.has(queryData.modified, 'after') && queryData.modified.after) {
        constraints.push(`modified >= '${moment(queryData.modified.after).format("YYYY-MM-DD HH:mm:ss")}'`)
      }
      if (_.has(queryData.modified, 'before') && queryData.modified.before) {
        constraints.push(`modified <= '${moment(queryData.modified.before).format("YYYY-MM-DD HH:mm:ss")}'`)
      }
    }

    // creator contraint
    if (_.has(queryData,'author') && queryData.author) {
      constraints.push(`creator = ${queryData.author}`)
    }

    // file size constraint
    if (queryData.fileSize) {
      if (_.has(queryData.fileSize, 'low') && queryData.fileSize.low) {
        constraints.push(`file_size >= ${queryData.fileSize.low}`)
      }
      if (_.has(queryData.fileSize,'high') && queryData.fileSize.high) {
        constraints.push(`file_size <= ${queryData.fileSize.high}`)
      }
    }

    // file type constraint
    if (_.has(queryData, 'fileType') && queryData.fileType) {
      constraints.push(`file_type = ${queryData.fileType}`)
    }

    const constraintString = constraints.length == 0 ? "" : "where " + constraints.join(' AND ');
    console.log(constraintString)
    req.models.db.driver.execQuery('select * from dagr ' + constraintString , [], (err, result) => {
      console.log(err)
      console.log(result)
      res.send(result)
    })


  },

  sterileQuery: function(req, res) {

    req.models.dagr.all((err, allDagrs) => {

      Promise.all(allDagrs.map(val => { return new Promise((resolve, reject) =>{ reachability(req, val).then(related => { resolve({entry: val, related: related})  }) })})).then((results) => {
        console.log(results)
        const orphans = results.filter((val) => val.related.length == 0).map(val => val.entry)
        res.send(orphans)

      })

    })


  }

}