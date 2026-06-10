require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/connectDB');

async function apply() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`);

    console.log('Schema applied');
    process.exit(0);
  } catch (err) {
    console.error('Schema apply error', err);
    process.exit(1);
  }
}

apply();
