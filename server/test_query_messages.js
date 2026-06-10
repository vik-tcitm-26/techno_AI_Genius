require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/connectDB');
(async ()=>{
  try{
    const r = await db.query('SELECT id,name,email,subject,created_at FROM contact_messages ORDER BY id DESC LIMIT 5');
    console.log(r.rows);
  }catch(e){console.error(e)}
})();
