const client = require('./client'); 

const {
  createUser,
  loginUser,
  validateUser,
  fetchUsers,
  getUserById
} = require('./users'); 


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

let user1, user2, user3;

const seedData = async () => {
  console.log('Creating dummy users...');
  user1 = await createUser({
    email: 'user1@example.com',
    username: 'traveler_sam',
    password: 'password123',
    subscription_plan: 'premium'
  });
  user2 = await createUser({
    email: 'user2@example.com',
    username: 'history_buff',
    password: 'securepass',
    subscription_plan: 'free'
  });
  user3 = await createUser({
    email: 'user3@example.com',
    username: 'foodie_ana',
    password: 'mypassword',
    subscription_plan: 'free'
  });
  console.log('Users created!');
  console.log('  User1:', user1.username, user1.id);
  console.log('  User2:', user2.username, user2.id);
  console.log('  User3:', user3.username, user3.id);
};
const syncAndSeed = async () => {
  console.log('Starting database synchronization and seeding...');
  try {
    console.log('Connecting to client...');
    await client.connect(); 
    console.log('Connected!');

    await dropTables();
    await createTables();
    await seedData(); 
    console.log('\n--- Demonstrating User Functions ---');

    console.log('\nAttempting to log in traveler_sam...');
    const loginResult = await loginUser('traveler_sam', 'password123');
    console.log('Login successful! Token:', loginResult.token ? '[GENERATED]' : '[FAILED]', 'User:', loginResult.user.username);
    const userToken = loginResult.token;

    if (userToken) {
      console.log('\nValidating user token...');
      const validatedUser = await validateUser(userToken);
      console.log('Token validated! User from token:', validatedUser.username, 'ID:', validatedUser.id);
    } else {
      console.log('Skipping token validation as no token was generated.');
    }

    if (user1 && user1.id) {
        console.log('\nFetching user1 by ID...');
        const fetchedUserById = await getUserById(user1.id);
        console.log('User fetched by ID:', fetchedUserById.username, 'Email:', fetchedUserById.email);
    } else {
        console.log('Skipping getUserById as user1 data is not available.');
    }

    console.log('\nFetching all users...');
    const allUsers = await fetchUsers();
    console.log('All users fetched (count:', allUsers.length, '):');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Plan: ${user.subscription_plan}`);
    });

    console.log('\n--- End of User Function Demonstration ---');
    console.log('Database synchronization and seeding complete!');

  } catch (error) {
    console.error('Database synchronization and seeding failed:', error);
  } finally {
    await client.end(); 
    console.log('Disconnected from DB');
  }
};

syncAndSeed();