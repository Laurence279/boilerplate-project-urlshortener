require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const crypto = require('crypto')
const db = require("./db/connection.js");

const MAPPING_LIMIT = 100

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({
  extended: true
}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortURL = req.params.short_url;
  const foundURL = await findUrlMappingById(shortURL);
  console.log(`Found URL was:`,foundURL);

  if(foundURL) {
    res.redirect(foundURL.original_url);
  } 
  else{
    res.status(404).send("Requested URL has expired or does not exist.");
  }


})

app.post('/api/shorturl', async function(req, res) {
  
  const requestedURL = req.body.url;
  const valid = isValidHttpURL(requestedURL);
  if(!valid) {
    res.json({error: 'invalid url'});
    return;
  }

  const mappings = await findAllMappings();

  const expiredMappings = await deleteExpiredMappings(mappings);
  console.log("Expired mappings removed:", expiredMappings);

  if(mappings.length >= MAPPING_LIMIT)
  {
    res.json({error: `Too many URLs! Please try again later.`})
    return;
  }

  const shortenedURL = await generateShortURL(requestedURL);

  const result = {
    original_url: shortenedURL.original_url,
    short_url: shortenedURL.short_url
  }
  res.json(result);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

function isValidHttpURL(string) {
  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

async function generateShortURL(url){

  // Check if url exists already and return its mapping if it does
  const foundURL = await findUrlMappingByURL(url);
  console.log(`Found URL was:`, foundURL);
  if(foundURL) return foundURL;

  // Create object with uuid and ensure it doesnt exist in db
      // If id already exists, generate a new uuid and check again..
  
  const id = crypto.randomUUID().substring(0, 5);
  const isIdUnique = await findUrlMappingById(id) === null;
  console.log(`isIdUnique?`, isIdUnique)
  if(!isIdUnique) return generateShortURL(url);

  // Save object with url and id in db and return the object

  const urlMapping = {id, url}
  const mapping = await createUrlMapping(urlMapping);
  console.log(`Creating new mapping:`, mapping);
  return mapping;
}

async function findAllMappings(){
  const data = await db.query(
    `SELECT * FROM mappings;`
  )
  return data.rows;
}

async function findUrlMappingByURL(url){
  const data = await db.query(
    `SELECT * FROM mappings WHERE original_url=$1;`, [url]
  )
  return data.rows.length === 0 ? null : data.rows[0];
}

async function findUrlMappingById(id){
  const data = await db.query(
    `SELECT * FROM mappings WHERE short_url=$1;`, [id]
  )
  return data.rows.length === 0 ? null : data.rows[0];
}

async function createUrlMapping(mapping){
  const expiry = new Date().setDate(new Date().getDate() + 7);
  console.log(expiry);
  const data = await db.query(
    `INSERT INTO mappings (original_url, short_url, expiry_date) VALUES ($1, $2, $3) RETURNING *;`,
    [mapping.url, mapping.id, expiry]
  );
  return data.rows[0];
}

async function deleteExpiredMappings(mappings){

  const removedMappings = [];

  for(let i = 0; i < mappings.length; i++){
    
    const today = new Date();
    const expiry = new Date(Number(mappings[i].expiry_date))

    // Have we reached the expiry date yet?
    if(today <= expiry) continue;

    const data = await db.query(
      `DELETE FROM mappings WHERE id=$1 RETURNING *;`, [mappings[i].id]
    )
    
    removedMappings.push(data.rows[0]);

  }

  return removedMappings;
  
}