const db = require('../config/connectDB');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || 'vi' + Date.now();
    const featured = data.featured || false;
    const visibility = data.visibility !== false;

    const queryText = `
      INSERT INTO videos 
      (id, youtube_id, title, description, series, playlist, topic, featured, visibility, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`;

    const values = [
      id,
      data.youtubeId || data.youtube_id,
      data.title,
      data.description,
      data.series,
      data.playlist,
      data.topic,
      featured,
      visibility
    ];

    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const item = existing.rows[0];
    const youtubeId = data.youtubeId !== undefined ? data.youtubeId : (data.youtube_id !== undefined ? data.youtube_id : item.youtube_id);
    const title = data.title !== undefined ? data.title : item.title;
    const description = data.description !== undefined ? data.description : item.description;
    const series = data.series !== undefined ? data.series : item.series;
    const playlist = data.playlist !== undefined ? data.playlist : item.playlist;
    const topic = data.topic !== undefined ? data.topic : item.topic;
    const featured = data.featured !== undefined ? data.featured : item.featured;
    const visibility = data.visibility !== undefined ? data.visibility : item.visibility;

    const queryText = `
      UPDATE videos 
      SET youtube_id = $1, title = $2, description = $3, series = $4, playlist = $5, topic = $6, 
          featured = $7, visibility = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *`;

    const values = [youtubeId, title, description, series, playlist, topic, featured, visibility, id];
    const result = await db.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
