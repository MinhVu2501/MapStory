const client = require('./client'); 

const {
  createUser,
  loginUser,
  validateUser,
  fetchUsers,
  getUserById
} = require('./users'); 

const {
  createMap,
  fetchMaps,    
  getMapById,   
  updateMap,       
} = require('./src/db/maps');

const {
  createMarker,
  fetchMarkers,  
  getMarkerById, 
  updateMarker,  
  deleteMarker  
} = require('./src/db/markers');

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
        views INT DEFAULT 0 NOT NULL,
        likes INT DEFAULT 0 NOT NULL,
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

      CREATE TABLE user_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, map_id)
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
let map1, map2, map3;
let marker1_map1; 

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

  console.log('\nCreating dummy maps...');
  map1 = await createMap({ 
    userId: user1.id,
    title: 'My Da Lat Adventure',
    description: 'A journey through the beautiful city of Da Lat, Vietnam.',
    isPublic: true,
    centerLat: 11.9404, 
    centerLng: 108.4599,
    zoomLevel: 12,
    thumbnailUrl: 'https://example.com/dalat_thumbnail.jpg'
  });

  map2 = await createMap({ 
    userId: user2.id,
    title: 'Historical Landmarks of Hanoi',
    description: 'Exploring ancient temples and significant sites in Hanoi.',
    isPublic: true,
    centerLat: 21.0278, 
    centerLng: 105.8342,
    zoomLevel: 13,
    thumbnailUrl: 'https://example.com/hanoi_history_thumbnail.jpg'
  });

  map3 = await createMap({
    userId: user3.id,
    title: 'Saigon Food Tour',
    description: 'My top picks for street food and cafes in Ho Chi Minh City.',
    isPublic: true,
    centerLat: 10.7626, 
    centerLng: 106.6601,
    zoomLevel: 14,
    thumbnailUrl: 'https://example.com/saigon_food_thumbnail.jpg'
  });
  console.log('Maps created!');
  console.log('  Map1:', map1.title, map1.id);
  console.log('  Map2:', map2.title, map2.id);
  console.log('  Map3:', map3.title, map3.id);

  console.log('\nCreating dummy markers...');
 
  marker1_map1 = await createMarker({ 
    mapId: map1.id,
    name: 'Xuan Huong Lake',
    description: 'The iconic lake at the heart of Da Lat. Great for a morning stroll.',
    latitude: 11.9416,
    longitude: 108.4428,
    imageUrl: 'https://example.com/xuanhuonglake.jpg',
    orderIndex: 1
  });
  await createMarker({
    mapId: map1.id,
    name: 'Dalat Railway Station',
    description: 'A beautiful old train station, a popular spot for photos.',
    latitude: 11.9427,
    longitude: 108.4554,
    imageUrl: 'https://example.com/railwaystation.jpg',
    orderIndex: 2
  });
  await createMarker({
    mapId: map1.id,
    name: 'Linh Phuoc Pagoda',
    description: 'Unique pagoda made of broken pottery and glass.',
    latitude: 11.9392,
    longitude: 108.5029,
    imageUrl: 'https://example.com/linhphuoc.jpg',
    orderIndex: 3
  });


  await createMarker({
    mapId: map2.id,
    name: 'Hoan Kiem Lake',
    description: 'The spiritual and geographical heart of Hanoi.',
    latitude: 21.0287,
    longitude: 105.8524,
    imageUrl: 'https://example.com/hoankiem.jpg',
    orderIndex: 1
  });
  await createMarker({
    mapId: map2.id,
    name: 'Temple of Literature',
    description: 'Vietnam\'s first national university.',
    latitude: 21.0278,
    longitude: 105.8342,
    imageUrl: 'https://example.com/templeoflit.jpg',
    orderIndex: 2
  });


  await createMarker({
    mapId: map3.id,
    name: 'Ben Thanh Market',
    description: 'A bustling market with a variety of goods and street food.',
    latitude: 10.7725,
    longitude: 106.6993,
    imageUrl: 'https://example.com/benthanh.jpg',
    orderIndex: 1
  });
  await createMarker({
    mapId: map3.id,
    name: 'Bui Vien Street',
    description: 'The famous backpacker street, lively at night.',
    latitude: 10.7675,
    longitude: 106.6925,
    imageUrl: 'https://example.com/buivien.jpg',
    orderIndex: 2
  });
  console.log('Markers created!');
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

    console.log('\n--- Demonstrating Map Functions ---');

    console.log('\nFetching all public maps...');
    const publicMaps = await fetchMaps();
    console.log('Public maps fetched (count:', publicMaps.length, '):');
    publicMaps.forEach(map => {
      console.log(`  - ${map.title} (ID: ${map.id}, Owner: ${map.user_id})`);
    });

    if (user1 && user1.id) {
        console.log(`\nFetching maps for user: ${user1.username} (ID: ${user1.id})...`);
        const user1Maps = await fetchMaps(user1.id);
        console.log(`Maps for ${user1.username} (count: ${user1Maps.length}):`);
        user1Maps.forEach(map => {
            console.log(`  - ${map.title} (ID: ${map.id})`);
        });
    }

    if (map1 && map1.id) {
        console.log(`\nFetching map by ID: ${map1.id} (${map1.title})...`);
        const fetchedMapById = await getMapById(map1.id);
        console.log('Map fetched by ID:', fetchedMapById.title, 'Description:', fetchedMapById.description);
    } else {
        console.log('Skipping getMapById as map1 data is not available.');
    }

    if (map1 && map1.id) {
        console.log(`\nUpdating map: ${map1.title} (ID: ${map1.id})...`);
        const updatedMap = await updateMap(map1.id, {
            is_public: false,
            description: 'This map is now private and has an updated description.'
        });
        console.log('Map updated:', updatedMap.title, 'Is Public:', updatedMap.is_public, 'Description:', updatedMap.description);

        console.log(`Verifying update for map: ${updatedMap.title}...`);
        const verifiedMap = await getMapById(updatedMap.id);
        console.log('Verified Map Is Public:', verifiedMap.is_public, 'Verified Description:', verifiedMap.description);
    } else {
        console.log('Skipping updateMap as map1 data is not available.');
    }

    console.log('\n--- End of Map Function Demonstration ---');

    console.log('\n--- Demonstrating Marker Functions ---');


    if (map1 && map1.id) {
        console.log(`\nFetching markers for map: ${map1.title} (ID: ${map1.id})...`);
        const map1Markers = await fetchMarkers(map1.id);
        console.log(`Markers for ${map1.title} (count: ${map1Markers.length}):`);
        map1Markers.forEach(marker => {
            console.log(`  - ${marker.name} (Lat: ${marker.latitude}, Lng: ${marker.longitude})`);
        });
    } else {
        console.log('Skipping fetchMarkers as map1 data is not available.');
    }


    if (marker1_map1 && marker1_map1.id) {
        console.log(`\nFetching marker by ID: ${marker1_map1.id} (${marker1_map1.name})...`);
        const fetchedMarkerById = await getMarkerById(marker1_map1.id);
        console.log('Marker fetched by ID:', fetchedMarkerById.name, 'Description:', fetchedMarkerById.description);
    } else {
        console.log('Skipping getMarkerById as marker1_map1 data is not available.');
    }

    if (marker1_map1 && marker1_map1.id) {
        console.log(`\nUpdating marker: ${marker1_map1.name} (ID: ${marker1_map1.id})...`);
        const updatedMarker = await updateMarker(marker1_map1.id, {
            name: 'Xuan Huong Lake (Updated Name)',
            description: 'The scenic heart of Da Lat, perfect for a peaceful walk around the lake.'
        });
        console.log('Marker updated:', updatedMarker.name, 'Description:', updatedMarker.description);

        console.log(`Verifying update for marker: ${updatedMarker.name}...`);
        const verifiedMarker = await getMarkerById(updatedMarker.id);
        console.log('Verified Marker Name:', verifiedMarker.name, 'Verified Description:', verifiedMarker.description);
    } else {
        console.log('Skipping updateMarker as marker1_map1 data is not available.');
    }

    

    console.log('\n--- End of Marker Function Demonstration ---');



    console.log('Database synchronization and seeding complete!');

  } catch (error) {
    console.error('Database synchronization and seeding failed:', error);
  } finally {
    await client.end(); 
    console.log('Disconnected from DB');
  }
};

syncAndSeed();