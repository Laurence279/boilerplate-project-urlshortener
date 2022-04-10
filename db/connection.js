const pg = require("pg");

const connectionString = require("../config.js");

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
