const fs = require('fs');
const path = require('path');

// Simulate a browser environment to extract seed arrays
const window = {};
try {
  const dataPath = path.join(__dirname, '../client/js/data.js');
  const code = fs.readFileSync(dataPath, 'utf8');
  // Evaluate the data definitions
  eval(code);
} catch (err) {
  console.error('Failed to read seed data from frontend data.js', err);
}

module.exports = {
  insights: window._TAG_INSIGHT_SEED || [],
  videos: window._TAG_VIDEO_SEED || [],
  events: window._TAG_EVENT_SEED || [],
  podcasts: window._TAG_PODCAST_SEED || [],
  gallery: window._TAG_GALLERY_SEED || []
};
