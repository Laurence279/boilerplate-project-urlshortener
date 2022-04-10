// this environment variable gets handed to us by heroku if we use the postgres add-on
const connectionString = process.env.DATABASE_URI;

module.exports = connectionString;