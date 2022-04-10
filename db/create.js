const db = require("./connection.js");

async function create(){
await db.query(
  `
  DROP TABLE mappings;
  CREATE TABLE IF NOT EXISTS mappings (id SERIAL PRIMARY KEY, original_url TEXT, short_url TEXT);
  `
)}

create();


db.end();
