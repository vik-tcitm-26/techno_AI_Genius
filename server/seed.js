const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./config/connectDB');
const seedData = require('./seedData');

async function seed() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Connecting to PostgreSQL database and resetting schema...');
  // Execute schema DDL
  await pool.query(schemaSql);
  console.log('Schema reset complete.');

  // 1. Seed Admin User
  const adminPassword = 'TAGAdmin2024';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);
  await pool.query(
    'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
    ['admin', passwordHash]
  );
  console.log('Seeded default admin user (username: admin, password: TAGAdmin2024)');

  // 2. Seed Settings
  await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['formspreeId', '']);
  await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['newsletterConsent', 'true']);
  console.log('Seeded default settings.');

  // 3. Seed Insights
  for (const item of seedData.insights) {
    await pool.query(
      `INSERT INTO insights 
       (id, type, title, slug, subcategory, category, tags, excerpt, body, image, image_data, featured_image, author, status, visibility, featured, date, read_time, seo, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        item.id,
        item.type || 'article',
        item.title,
        item.slug,
        item.subcategory,
        item.category,
        item.tags,
        item.excerpt,
        item.body,
        item.image || null,
        item.imageData || '',
        item.featuredImage || '',
        item.author || 'Varish Gahlot',
        item.status || 'draft',
        item.visibility !== false,
        item.featured || false,
        item.date,
        item.readTime,
        JSON.stringify(item.seo || {}),
        item.createdAt ? new Date(item.createdAt) : new Date(),
        item.updatedAt ? new Date(item.updatedAt) : new Date()
      ]
    );
  }
  console.log(`Seeded ${seedData.insights.length} insights.`);

  // 4. Seed Videos
  for (const item of seedData.videos) {
    await pool.query(
      `INSERT INTO videos 
       (id, youtube_id, title, description, series, playlist, topic, featured, visibility, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        item.id,
        item.youtubeId,
        item.title,
        item.description,
        item.series,
        item.playlist,
        item.topic,
        item.featured || false,
        item.visibility !== false,
        item.createdAt ? new Date(item.createdAt) : new Date(),
        item.updatedAt ? new Date(item.updatedAt) : new Date()
      ]
    );
  }
  console.log(`Seeded ${seedData.videos.length} videos.`);

  // 5. Seed Events
  for (const item of seedData.events) {
    await pool.query(
      `INSERT INTO events 
       (id, title, description, date, type, capacity, status, visibility, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        item.id,
        item.title,
        item.description,
        item.date,
        item.type || 'online',
        item.capacity ? String(item.capacity) : '',
        item.status || 'upcoming',
        item.visibility !== false,
        item.createdAt ? new Date(item.createdAt) : new Date(),
        item.updatedAt ? new Date(item.updatedAt) : new Date()
      ]
    );
  }
  console.log(`Seeded ${seedData.events.length} events.`);

  // 6. Seed Podcasts
  for (const item of seedData.podcasts) {
    await pool.query(
      `INSERT INTO podcasts 
       (id, title, description, duration, episode, date, status, embed_url, visibility, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        item.id,
        item.title,
        item.description,
        item.duration,
        item.episode,
        item.date,
        item.status || 'upcoming',
        item.embedUrl || '',
        item.visibility !== false,
        item.createdAt ? new Date(item.createdAt) : new Date(),
        item.updatedAt ? new Date(item.updatedAt) : new Date()
      ]
    );
  }
  console.log(`Seeded ${seedData.podcasts.length} podcasts.`);

  // 7. Seed Gallery
  for (const item of seedData.gallery) {
    await pool.query(
      `INSERT INTO gallery 
       (id, filename, url, type, size, category, caption, alt, uploaded_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        item.id,
        item.filename,
        item.url,
        item.type,
        item.size || 0,
        item.category || 'general',
        item.caption || '',
        item.alt || '',
        item.uploadedAt ? new Date(item.uploadedAt) : new Date()
      ]
    );
  }
  console.log(`Seeded ${seedData.gallery.length} gallery items.`);
}

seed()
  .then(() => {
    console.log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
