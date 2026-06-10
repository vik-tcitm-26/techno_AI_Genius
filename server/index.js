const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import DB pool to verify connection
const { pool } = require('./config/connectDB');

// Import Routers
const authRoutes = require('./routers/authRoutes');
const insightRoutes = require('./routers/insightRoutes');
const videoRoutes = require('./routers/videoRoutes');
const eventRoutes = require('./routers/eventRoutes');
const podcastRoutes = require('./routers/podcastRoutes');
const communityRoutes = require('./routers/communityRoutes');
const mediaRoutes = require('./routers/mediaRoutes');
const settingsRoutes = require('./routers/settingsRoutes');
const contactRoutes = require('./routers/contactRoutes');
const newsletterRoutes = require('./routers/newsletterRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Log incoming requests (helpful for debugging API calls)
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Serve Static Frontend files from the client directory
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Extensionless routing middleware - maps /page to /page.html
app.get('/:page', (req, res, next) => {
  const fs = require('fs');
  const requestedFile = path.join(clientPath, `${req.params.page}.html`);
  
  // Check if the HTML file exists
  if (fs.existsSync(requestedFile)) {
    return res.sendFile(requestedFile);
  }
  
  // If not found, continue to next middleware
  next();
});

// Fallback to serving index.html for root path and unknown routes
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Test database connection and start listening
console.log('DEBUG env PG_PASSWORD type:', typeof process.env.PG_PASSWORD, 'value:', String(process.env.PG_PASSWORD));
pool.query('SELECT NOW()')
  .then((res) => {
    console.log(`[Database] Connection test successful. DB time is ${res.rows[0].now}`);
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database] Connection test failed! Could not start server.', err);
    process.exit(1);
  });
