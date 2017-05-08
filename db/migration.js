'use strict';

var pool = require('./pool');


module.exports = {
  // setup the tables
  migrate: function() {
    pool.query(`
      CREATE TABLE IF NOT EXISTS DAGR(
        id varchar(32) PRIMARY KEY,
        alias varchar(100) not null
        path varchar(255) not null
        created datetime 
      );`
      ).then(() => {

      return pool.query(`
      CREATE TABLE IF NOT EXISTS ACTOR(
        id serial PRIMARY KEY,
        NAME VARCHAR(100) NOT NULL
      )
      `)

    }).then(() => {

      return pool.query(`
      CREATE TABLE IF NOT EXISTS DIRECTOR(
        id serial PRIMARY KEY,
        NAME VARCHAR(100) NOT NULL
      )
      `)

    }).then(() => {

      return pool.query(`
      CREATE TABLE IF NOT EXISTS FRANCHISE(
        id serial PRIMARY KEY,
        NAME VARCHAR(100) NOT NULL,
        profit int not null
      )
      `)

    }).then(() => {
      return pool.query(`
      CREATE TABLE IF NOT EXISTS WEEK(
        id serial PRIMARY KEY,
        count int NOT NULL,
        year int NOT NULL
      )
      `)
    }).then(() => {
      return pool.query(`
      CREATE TABLE IF NOT EXISTS WEEKRESULTS(
        id serial PRIMARY KEY,
        week_id int REFERENCES week(id),
        movie_id int REFERENCES movie(id),
        profit int not null,
        is_top boolean not null
      )
      `)
    }).then(() => {
      return pool.query(`
      CREATE TABLE IF NOT EXISTS MovieActors(
        movie_id int REFERENCES movie(id),
        actor_id int REFERENCES actor(id)
      )
      `)
    }).then(() => {
      return pool.query(`
      CREATE TABLE IF NOT EXISTS MovieDirectors(
        movie_id int REFERENCES movie(id),
        director_id int REFERENCES director(id)
      )
      `)
    }).then(() => {
      return pool.query(`
      CREATE TABLE IF NOT EXISTS MovieFranchise(
        movie_id int REFERENCES movie(id),
        franchise_id int REFERENCES franchise(id)
      )
      `)
    })
  }
}