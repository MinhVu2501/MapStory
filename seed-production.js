require('dotenv').config();
const client = require('./client');
const bcrypt = require('bcryptjs');

const seedProductionData = async () => {
  try {
    console.log('🌱 Starting production data seeding...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if we already have data
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('📊 Data already exists, skipping seed...');
      return;
    }

    // Create demo user
    console.log('👤 Creating demo user...');
    const hashedPassword = await bcrypt.hash('DemoUser123!', 10);
    const userResult = await client.query(`
      INSERT INTO users (username, email, password_hash, subscription_plan)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `, ['demo_user', 'demo@mapstory.com', hashedPassword, 'free']);
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Demo user created with ID: ${userId}`);

    // Create sample maps
    console.log('🗺️  Creating sample maps...');
    
    // Map 1: Saigon Food Tour
    const map1Result = await client.query(`
      INSERT INTO maps (user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, views, likes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `, [
      userId,
      'Saigon Food Tour',
      'A delicious journey through Ho Chi Minh City\'s best food spots',
      true,
      10.8231,
      106.6297,
      13,
      null,
      42,
      15
    ]);
    
    const map1Id = map1Result.rows[0].id;

    // Add markers for Saigon Food Tour
    const saigonMarkers = [
      {
        name: 'Ben Thanh Market',
        description: 'Famous market with local street food and souvenirs',
        latitude: 10.8231,
        longitude: 106.6297,
        image_url: '/images/cho-ben-thanh.jpeg',
        order_index: 1
      },
      {
        name: 'Bui Vien Street',
        description: 'Backpacker street with bars and street food',
        latitude: 10.8267,
        longitude: 106.6958,
        image_url: '/images/bui-vien-street.jpeg',
        order_index: 2
      },
      {
        name: 'Pho 24',
        description: 'Popular pho restaurant chain',
        latitude: 10.7769,
        longitude: 106.7009,
        image_url: '/images/pho-24.jpeg',
        order_index: 3
      },
      {
        name: 'Banh Mi Huynh Hoa',
        description: 'Famous banh mi sandwich shop',
        latitude: 10.7884,
        longitude: 106.6917,
        image_url: '/images/banh-mi-huynh-hoa.jpeg',
        order_index: 4
      },
      {
        name: 'Secret Garden',
        description: 'Hidden rooftop restaurant with Vietnamese cuisine',
        latitude: 10.7769,
        longitude: 106.7009,
        image_url: '/images/secret-garden.jpeg',
        order_index: 5
      }
    ];

    for (const marker of saigonMarkers) {
      await client.query(`
        INSERT INTO markers (map_id, name, description, latitude, longitude, image_url, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [map1Id, marker.name, marker.description, marker.latitude, marker.longitude, marker.image_url, marker.order_index]);
    }

    // Map 2: Historical Landmarks of Hanoi
    const map2Result = await client.query(`
      INSERT INTO maps (user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, views, likes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `, [
      userId,
      'Historical Landmarks of Hanoi',
      'Explore the rich history and culture of Vietnam\'s capital city',
      true,
      21.0285,
      105.8542,
      12,
      null,
      28,
      8
    ]);

    const map2Id = map2Result.rows[0].id;

    // Add markers for Hanoi Historical Tour
    const hanoiMarkers = [
      {
        name: 'Hoan Kiem Lake',
        description: 'Historic lake in the heart of Hanoi with Ngoc Son Temple',
        latitude: 21.0285,
        longitude: 105.8542,
        image_url: null,
        order_index: 1
      },
      {
        name: 'Temple of Literature',
        description: 'Vietnam\'s first university, dedicated to Confucius',
        latitude: 21.0227,
        longitude: 105.8363,
        image_url: null,
        order_index: 2
      },
      {
        name: 'Ho Chi Minh Mausoleum',
        description: 'Final resting place of Vietnam\'s revolutionary leader',
        latitude: 21.0361,
        longitude: 105.8342,
        image_url: null,
        order_index: 3
      }
    ];

    for (const marker of hanoiMarkers) {
      await client.query(`
        INSERT INTO markers (map_id, name, description, latitude, longitude, image_url, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [map2Id, marker.name, marker.description, marker.latitude, marker.longitude, marker.image_url, marker.order_index]);
    }

    // Map 3: Tokyo Highlights
    const map3Result = await client.query(`
      INSERT INTO maps (user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, views, likes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `, [
      userId,
      'Tokyo Highlights',
      'Must-see attractions in Japan\'s bustling capital',
      true,
      35.6762,
      139.6503,
      11,
      null,
      67,
      23
    ]);

    const map3Id = map3Result.rows[0].id;

    // Add markers for Tokyo tour
    const tokyoMarkers = [
      {
        name: 'Tokyo Tower',
        description: 'Iconic red and white communications tower',
        latitude: 35.6586,
        longitude: 139.7454,
        image_url: null,
        order_index: 1
      },
      {
        name: 'Senso-ji Temple',
        description: 'Ancient Buddhist temple in Asakusa district',
        latitude: 35.7148,
        longitude: 139.7967,
        image_url: null,
        order_index: 2
      },
      {
        name: 'Shibuya Crossing',
        description: 'World\'s busiest pedestrian crossing',
        latitude: 35.6598,
        longitude: 139.7006,
        image_url: null,
        order_index: 3
      }
    ];

    for (const marker of tokyoMarkers) {
      await client.query(`
        INSERT INTO markers (map_id, name, description, latitude, longitude, image_url, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [map3Id, marker.name, marker.description, marker.latitude, marker.longitude, marker.image_url, marker.order_index]);
    }

    console.log('✅ Sample maps and markers created successfully!');
    console.log('📊 Production seed data completed:');
    console.log('   - 1 demo user');
    console.log('   - 3 public maps');
    console.log('   - 11 markers total');

  } catch (error) {
    console.error('❌ Error seeding production data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔐 Database connection closed.');
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedProductionData()
    .then(() => {
      console.log('🎉 Production seed script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Production seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProductionData }; 