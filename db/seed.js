const client = require('./client.js');

const dropTables = async () => {
  try {
    console.log('Starting to drop tables...');
    await client.query(`
      DROP TABLE IF EXISTS markers CASCADE;
      DROP TABLE IF EXISTS maps CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error; 
  }
};

const createTables = async () => {
  try {
    console.log('Starting to create tables...');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE,
        subscription_plan VARCHAR(50) DEFAULT 'free' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE maps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT TRUE NOT NULL,
        center_lat DECIMAL(10, 8) NOT NULL,
        center_lng DECIMAL(11, 8) NOT NULL,
        zoom_level INT NOT NULL,
        thumbnail_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE markers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        image_url VARCHAR(255),
        order_index INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_maps_updated_at
          BEFORE UPDATE ON maps
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_markers_updated_at
          BEFORE UPDATE ON markers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const syncAndSeed = async () => {
  try {
    console.log('Connecting to client...');
    await client.connect();
    console.log('Connected!');

    console.log('Dropping tables...');
    await dropTables();
    console.log('Dropped!');

    console.log('Generating tables...');
    await createTables();
    console.log('Generated!');

  } catch (error) {
    console.error('Error in syncAndSeed:', error);
  } finally {
    await client.end();
    console.log('Disconnected from DB');
  }
};

syncAndSeed();
