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

}
