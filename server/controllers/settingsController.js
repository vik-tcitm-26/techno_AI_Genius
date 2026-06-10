const db = require('../config/connectDB');

exports.getSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings');
    // Transform rows into a single key-value object
    const settingsObj = {};
    result.rows.forEach(row => {
      // Cast 'true'/'false' strings to boolean if necessary
      if (row.value === 'true') {
        settingsObj[row.key] = true;
      } else if (row.value === 'false') {
        settingsObj[row.key] = false;
      } else {
        settingsObj[row.key] = row.value;
      }
    });

    res.json(settingsObj);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = String(value);
      
      // Upsert setting key
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, stringValue]
      );
    }

    res.json({ success: true, updated: settings });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
