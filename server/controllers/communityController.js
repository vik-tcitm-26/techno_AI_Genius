const db = require('../config/connectDB');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM community ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching community members:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const id = 'cm' + Date.now();
    const firstName = data.firstName || data.first_name || '';
    const lastName = data.lastName || data.last_name || '';
    const email = data.email || '';
    const role = data.role || '';
    const country = data.country || '';
    const message = data.message || '';
    const newsletter = data.newsletter !== false;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const queryText = `
      INSERT INTO community 
      (id, first_name, last_name, email, role, country, message, newsletter, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`;

    const values = [id, firstName, lastName, email, role, country, message, newsletter];
    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error joining community:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM community WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community member not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting community member:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
