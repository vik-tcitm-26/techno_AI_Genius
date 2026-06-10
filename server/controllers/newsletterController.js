const db = require('../config/connectDB');

async function subscribe(req, res) {
  const { email } = req.body;
  try {
    const exists = await db.query('SELECT id FROM subscribers WHERE email = $1', [email.trim().toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already subscribed.' });

    const insert = await db.query('INSERT INTO subscribers (email) VALUES ($1) RETURNING id, created_at', [email.trim().toLowerCase()]);
    const rec = insert.rows[0];

    return res.status(201).json({ ok: true, id: rec.id, created_at: rec.created_at });
  } catch (err) {
    console.error('[newsletterController] subscribe error', err);
    return res.status(500).json({ error: 'Server error subscribing email.' });
  }
}

async function getSubscribers(req, res) {
  try {
    const result = await db.query('SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (err) {
    console.error('[newsletterController] getSubscribers error', err);
    return res.status(500).json({ error: 'Server error fetching subscribers.' });
  }
}

module.exports = { subscribe, getSubscribers };
