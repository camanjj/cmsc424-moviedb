'use strict';

var fs = require('fs')
var Promise = require('bluebird')
var Xray = require('x-ray');
var xray = Xray({
  filters: {
    trim: function (value) {
      return typeof value === 'string' ? value.trim() : value
    }
  }
}).concurrency(5);

module.exports = {

  getFranchises: function() {

    xray('http://www.boxofficemojo.com/franchises/', {
      franchises: xray('tr:not(:first-child)', [{
        name: 'td:first-child@text | trim',
        link: 'td:first-child a@href',
        profit: 'td:nth-child(2)@text',
        movies: xray('td:first-child a@href', ['table:first-child tr:not(:first-child) td:nth-child(2)@text'])
      }])
    }).write('results.json')    
  },

  getActors: function() {
    
    for (var i = 1; i < 4; i++) {
        xray(`http://www.boxofficemojo.com/people/?view=Actor&pagenum=${i}&sort=person&order=ASC&p=.htm`, {
          actors: xray('tr:not(:first-child)', [{
            name: 'td:first-child@text | trim',
            link: 'td:first-child a@href',
            profit: 'td:nth-child(2)@text',
            roles: xray('td:first-child a@href', {
              movies: xray('td table:not(:last-child) tr:not(:first-child)', [{
                name: 'td:nth-child(2)@text',
                link: 'td:nth-child(2) a@href'
              }])
            })
          }])
        }).write(`actors${i}.json`)
    }
  },

  getDirectors: function() {

    for (var i = 1; i < 3; i++) {
      xray(`http://www.boxofficemojo.com/people/?view=Director&pagenum=${i}&sort=person&order=ASC&p=.htm`, {
        actors: xray('tr:not(:first-child)', [{
          name: 'td:first-child@text | trim',
          link: 'td:first-child a@href',
          profit: 'td:nth-child(2)@text',
          roles: xray('td:first-child a@href', {
            movies: xray('td table:not(:last-child) tr:not(:first-child)', [{
              name: 'td:nth-child(2)@text',
              link: 'td:nth-child(2) a@href'
            }])
          })
        }])
      }).write(`directors${i}.json`)
    }
  }
}

// ['td table:not(:last-child) tr:not(:first-child) td:nth-child(2)@text']

module.exports.getActors()