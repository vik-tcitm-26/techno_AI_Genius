const db = require('../config/connectDB');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insights ORDER BY date DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM insights WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching insight:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    // Generate id if not exists
    const id = data.id || 'ins' + Date.now();
    const slug = data.slug || (data.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
    const author = data.author || 'Varish Gahlot';
    const type = data.type || 'article';
    const status = data.status || 'draft';
    const visibility = data.visibility !== false;
    const featured = data.featured || false;
    
    // Fallback image numbers/data
    const image = data.image || null;
    const imageData = data.imageData || '';
    const featuredImage = data.featuredImage || '';
    const date = data.date || new Date().toISOString().slice(0, 10);
    const readTime = data.readTime || '5 min';
    const seo = data.seo || {};

    const queryText = `
      INSERT INTO insights 
      (id, type, title, slug, subcategory, category, tags, excerpt, body, image, image_data, featured_image, author, status, visibility, featured, date, read_time, seo, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      RETURNING *`;
      
    const values = [
      id,
      type,
      data.title,
      slug,
      data.subcategory,
      data.category,
      data.tags || [],
      data.excerpt,
      data.body,
      image,
      imageData,
      featuredImage,
      author,
      status,
      visibility,
      featured,
      date,
      readTime,
      JSON.stringify(seo)
    ];

    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating insight:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Fetch existing
    const existing = await db.query('SELECT * FROM insights WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const item = existing.rows[0];
    const title = data.title !== undefined ? data.title : item.title;
    const slug = data.slug !== undefined ? data.slug : (data.title ? data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80) : item.slug);
    const type = data.type !== undefined ? data.type : item.type;
    const subcategory = data.subcategory !== undefined ? data.subcategory : item.subcategory;
    const category = data.category !== undefined ? data.category : item.category;
    const tags = data.tags !== undefined ? data.tags : item.tags;
    const excerpt = data.excerpt !== undefined ? data.excerpt : item.excerpt;
    const body = data.body !== undefined ? data.body : item.body;
    const image = data.image !== undefined ? data.image : item.image;
    const imageData = data.imageData !== undefined ? data.imageData : item.image_data;
    const featuredImage = data.featuredImage !== undefined ? data.featuredImage : item.featured_image;
    const author = data.author !== undefined ? data.author : item.author;
    const status = data.status !== undefined ? data.status : item.status;
    const visibility = data.visibility !== undefined ? data.visibility : item.visibility;
    const featured = data.featured !== undefined ? data.featured : item.featured;
    const date = data.date !== undefined ? data.date : item.date;
    const readTime = data.readTime !== undefined ? data.readTime : item.read_time;
    const seo = data.seo !== undefined ? JSON.stringify(data.seo) : JSON.stringify(item.seo);

    const queryText = `
      UPDATE insights 
      SET type = $1, title = $2, slug = $3, subcategory = $4, category = $5, tags = $6, excerpt = $7, 
          body = $8, image = $9, image_data = $10, featured_image = $11, author = $12, status = $13, 
          visibility = $14, featured = $15, date = $16, read_time = $17, seo = $18, updated_at = NOW()
      WHERE id = $19
      RETURNING *`;

    const values = [
      type, title, slug, subcategory, category, tags, excerpt, 
      body, image, imageData, featuredImage, author, status, 
      visibility, featured, date, readTime, seo, id
    ];

    const result = await db.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating insight:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM insights WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting insight:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
