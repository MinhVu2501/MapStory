require('dotenv').config();
const { Client } = require('pg');

const initializeDatabase = async () => {
  // Create a new client instance for initialization
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('render.com') 
      ? { rejectUnauthorized: false } 
      : false
  });
  
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Create users table
    console.log('📝 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create maps table
    console.log('📝 Creating maps table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS maps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT true,
        center_lat DECIMAL(10, 8) NOT NULL,
        center_lng DECIMAL(11, 8) NOT NULL,
        zoom_level INTEGER NOT NULL,
        thumbnail_url TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create markers table
    console.log('📝 Creating markers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS markers (
        id SERIAL PRIMARY KEY,
        map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        image_url TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_likes table
    console.log('📝 Creating user_likes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        map_id INTEGER REFERENCES maps(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, map_id)
      );
    `);

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_maps_user_id ON maps(user_id);
      CREATE INDEX IF NOT EXISTS idx_maps_is_public ON maps(is_public);
      CREATE INDEX IF NOT EXISTS idx_maps_created_at ON maps(created_at);
      CREATE INDEX IF NOT EXISTS idx_markers_map_id ON markers(map_id);
      CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_likes_map_id ON user_likes(map_id);
    `);

    console.log('✅ Database initialization completed successfully!');
    console.log('📊 Database schema is ready for production use.');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔐 Database connection closed.');
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 