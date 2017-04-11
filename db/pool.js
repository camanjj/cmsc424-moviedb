const pg = require('pg')
var parse = require('pg-connection-string').parse;

var config = parse(process.env.DB_URL || "postgres://localhost/cmsc424");

const pool = new pg.Pool(config);

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack)
})

//export the query method for passing queries to the pool
module.exports.query = function (text, values, callback) {
  console.log('query:', text, values);
  return pool.query(text, values, callback);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
module.exports.connect = function (callback) {
  return pool.connect(callback);
};