require('dotenv').config();
const { pool } = require('./config/connectDB');
console.log('Using pool from connectDB, attempting query');
pool.query('SELECT NOW()')
  .then(res => { console.log('OK', res.rows[0]); process.exit(0); })
  .catch(err => { console.error('ERR', err); process.exit(1); });
