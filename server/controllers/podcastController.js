const db = require('../config/connectDB');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM podcasts ORDER BY date DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching podcasts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM podcasts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast episode not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching podcast:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || 'po' + Date.now();
    const status = data.status || 'upcoming';
    const visibility = data.visibility !== false;

    const queryText = `
      INSERT INTO podcasts 
      (id, title, description, duration, episode, date, status, embed_url, visibility, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`;

    const values = [
      id,
      data.title,
      data.description,
      data.duration,
      data.episode,
      data.date,
      status,
      data.embedUrl || data.embed_url || '',
      visibility
    ];

    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating podcast:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await db.query('SELECT * FROM podcasts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    const item = existing.rows[0];
    const title = data.title !== undefined ? data.title : item.title;
    const description = data.description !== undefined ? data.description : item.description;
    const duration = data.duration !== undefined ? data.duration : item.duration;
    const episode = data.episode !== undefined ? data.episode : item.episode;
    const date = data.date !== undefined ? data.date : item.date;
    const status = data.status !== undefined ? data.status : item.status;
    const embedUrl = data.embedUrl !== undefined ? data.embedUrl : (data.embed_url !== undefined ? data.embed_url : item.embed_url);
    const visibility = data.visibility !== undefined ? data.visibility : item.visibility;

    const queryText = `
      UPDATE podcasts 
      SET title = $1, description = $2, duration = $3, episode = $4, date = $5, status = $6, 
          embed_url = $7, visibility = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *`;

    const values = [title, description, duration, episode, date, status, embedUrl, visibility, id];
    const result = await db.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating podcast:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM podcasts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting podcast:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
