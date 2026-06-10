const db = require('../config/connectDB');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || 'ev' + Date.now();
    const type = data.type || 'online';
    const status = data.status || 'upcoming';
    const visibility = data.visibility !== false;

    const queryText = `
      INSERT INTO events 
      (id, title, description, date, type, capacity, status, visibility, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`;

    const values = [
      id,
      data.title,
      data.description,
      data.date,
      type,
      data.capacity ? String(data.capacity) : '',
      status,
      visibility
    ];

    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const item = existing.rows[0];
    const title = data.title !== undefined ? data.title : item.title;
    const description = data.description !== undefined ? data.description : item.description;
    const date = data.date !== undefined ? data.date : item.date;
    const type = data.type !== undefined ? data.type : item.type;
    const capacity = data.capacity !== undefined ? String(data.capacity) : item.capacity;
    const status = data.status !== undefined ? data.status : item.status;
    const visibility = data.visibility !== undefined ? data.visibility : item.visibility;

    const queryText = `
      UPDATE events 
      SET title = $1, description = $2, date = $3, type = $4, capacity = $5, status = $6, 
          visibility = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *`;

    const values = [title, description, date, type, capacity, status, visibility, id];
    const result = await db.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
