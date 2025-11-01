const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let mongod;

async function startMemoryMongo() {
  console.log('[MongoDB] 🚀 Starting in-memory MongoDB...');

  // Create a MongoMemoryServer instance
  mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017, // Use the same port for consistency
      dbName: 'energy_consumption'
    },
    binary: {
      version: '7.0.0'
    }
  });

  const uri = mongod.getUri();
  console.log(`[MongoDB] ✅ Started at: ${uri}`);

  // Update .env.local with the connection string
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Replace existing MONGODB_URI or add it
    if (envContent.includes('MONGODB_URI=')) {
      envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${uri}`);
    } else {
      envContent += `\n# MongoDB connection for local development\nMONGODB_URI=${uri}\n`;
    }
  } else {
    envContent = `# MongoDB connection for local development\nMONGODB_URI=${uri}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('[MongoDB] 📝 Updated .env.local');

  // Seed the database
  await seedDatabase(uri);

  console.log('[MongoDB] ✨ Ready! Login: admin@test.com / password123');

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('[MongoDB] 🛑 Stopping...');
    if (mongod) {
      await mongod.stop();
    }
    console.log('[MongoDB] ✅ Stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (mongod) {
      await mongod.stop();
    }
    process.exit(0);
  });
}

async function seedDatabase(uri) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('[MongoDB] 🌱 Seeding database...');

    const db = client.db('energy_consumption');

    // Create default user
    const hashedPassword = await bcrypt.hash('password123', 10);

    await db.collection('users').deleteMany({});
    await db.collection('users').insertOne({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Enable registration feature flag
    await db.collection('featureflags').deleteMany({});
    await db.collection('featureflags').insertOne({
      name: 'registration',
      enabled: true,
      description: 'Enable user registration',
      createdAt: new Date()
    });

    console.log('[MongoDB] ✅ Database seeded!');
  } catch (error) {
    console.error('[MongoDB] ❌ Error seeding database:', error);
  } finally {
    await client.close();
  }
}

// Start the server
startMemoryMongo().catch(console.error);
