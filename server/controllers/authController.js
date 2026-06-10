const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/connectDB');
require('dotenv').config();

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    // Retrieve admin details
    const result = await db.query('SELECT * FROM admin_users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Sign JWT
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current, newPw } = req.body;
    if (!current || !newPw) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPw.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Get admin details
    const result = await db.query('SELECT * FROM admin_users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found.' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(current, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPw, salt);

    await db.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, admin.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
