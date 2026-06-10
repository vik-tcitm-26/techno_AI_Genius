require('dotenv').config();
const { Pool } = require('pg');
console.log('env password type:', typeof process.env.PG_PASSWORD);
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432')
});

pool.query('SELECT NOW()')
  .then(res => { console.log('OK', res.rows[0]); process.exit(0); })
  .catch(err => { console.error('ERR', err); process.exit(1); });
