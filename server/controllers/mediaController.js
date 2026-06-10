const db = require('../config/connectDB');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

exports.uploadMiddleware = upload.single('file');

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const category = req.body.category || 'general';
    const caption = req.body.caption || '';
    const alt = req.body.alt || req.file.originalname;
    const customFolder = req.body.folder || category || 'general';
    const cloudFolder = `techno_ai_genius/${customFolder}`;

    // Upload buffer to Cloudinary using stream; store files under folder by category
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: cloudFolder,
        resource_type: 'auto'
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
        }

        // Save metadata to database
        const id = 'g' + Date.now();
        const queryText = `
          INSERT INTO gallery 
          (id, filename, url, type, size, category, caption, alt, uploaded_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`;

        const values = [
          id,
          req.file.originalname,
          result.secure_url,
          req.file.mimetype,
          req.file.size,
          category,
          caption,
          alt
        ];

        try {
          const dbResult = await db.query(queryText, values);
          res.status(201).json(dbResult.rows[0]);
        } catch (dbErr) {
          console.error('Database insert error for gallery item:', dbErr);
          res.status(500).json({ error: 'Uploaded to cloud but database logging failed.' });
        }
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Media controller upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM gallery ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching media library:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing gallery item
    const existing = await db.query('SELECT * FROM gallery WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    const item = existing.rows[0];

    // Delete from Cloudinary if it is a Cloudinary URL
    if (item.url.includes('cloudinary.com')) {
      try {
        // Extract public ID from Cloudinary URL:
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/public_id.jpg
        const parts = item.url.split('/');
        const folderAndName = parts.slice(parts.indexOf('upload') + 2).join('/'); // e.g. folder/public_id.jpg
        const publicId = folderAndName.substring(0, folderAndName.lastIndexOf('.')); // e.g. folder/public_id
        
        await cloudinary.uploader.destroy(publicId);
      } catch (cErr) {
        console.warn('Could not delete asset from Cloudinary, deleting database row anyway.', cErr.message);
      }
    }

    // Delete database row
    await db.query('DELETE FROM gallery WHERE id = $1', [id]);
    res.json({ success: true, deleted: item });
  } catch (err) {
    console.error('Error deleting media item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
