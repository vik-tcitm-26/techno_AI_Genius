const db = require('../config/connectDB');

async function submitContact(req, res) {
  const { name, email, subject, message } = req.body;
  try {
    const insert = await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING id, created_at',
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );
    const record = insert.rows[0];

    return res.status(201).json({ ok: true, id: record.id, created_at: record.created_at });
  } catch (err) {
    console.error('[contactController] Error saving contact message', err);
    return res.status(500).json({ error: 'Server error saving message.' });
  }
}

async function getContacts(req, res) {
  try {
    const result = await db.query('SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (err) {
    console.error('[contactController] getContacts error', err);
    return res.status(500).json({ error: 'Server error fetching contact messages.' });
  }
}

module.exports = { submitContact, getContacts };
