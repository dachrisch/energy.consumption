const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
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

  const uri = mongod.getUri() + 'energy_consumption';
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

    // Create default user with fixed ObjectId for consistency
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userObjectId = new ObjectId('000000000000000000000001'); // Fixed userId for test data
    const userId = userObjectId.toString(); // Convert to string for Mongoose models

    await db.collection('users').deleteMany({});
    await db.collection('users').insertOne({
      _id: userObjectId,
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

    // Seed contracts
    await db.collection('contracts').deleteMany({});
    await db.collection('contracts').insertMany([
      {
        userId,
        type: 'power',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 100,
        workingPrice: 0.30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        type: 'power',
        startDate: new Date('2025-01-01'),
        basePrice: 120,
        workingPrice: 0.35,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        type: 'gas',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 80,
        workingPrice: 0.08,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        type: 'gas',
        startDate: new Date('2025-01-01'),
        basePrice: 90,
        workingPrice: 0.09,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Seed energy readings (2024 and 2025 data)
    await db.collection('energies').deleteMany({});

    const energyReadings = [];

    // 2024 Power readings (monthly, showing increasing consumption)
    for (let month = 0; month < 12; month++) {
      energyReadings.push({
        userId,
        type: 'power',
        amount: 1000 + (month * 350), // Cumulative: starts at 1000, increases by ~350/month
        date: new Date(2024, month, 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 2024 Gas readings (monthly, showing seasonal variation)
    for (let month = 0; month < 12; month++) {
      // Higher consumption in winter months (Nov-Mar)
      const isWinter = month >= 10 || month <= 2;
      const monthlyIncrease = isWinter ? 800 : 300;
      const previousReading = month === 0 ? 2000 : energyReadings.find(
        r => r.type === 'gas' && r.date.getMonth() === month - 1 && r.date.getFullYear() === 2024
      )?.amount || 2000;

      energyReadings.push({
        userId,
        type: 'gas',
        amount: previousReading + monthlyIncrease,
        date: new Date(2024, month, 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 2025 Power readings (Jan - current month + 1)
    const currentMonth = new Date().getMonth();
    const lastPowerReading2024 = 1000 + (11 * 350); // December 2024

    for (let month = 0; month <= Math.min(currentMonth + 1, 11); month++) {
      energyReadings.push({
        userId,
        type: 'power',
        amount: lastPowerReading2024 + (month * 370), // Slightly higher rate in 2025
        date: new Date(2025, month, 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 2025 Gas readings (Jan - current month + 1)
    const lastGasReading2024 = energyReadings
      .filter(r => r.type === 'gas' && r.date.getFullYear() === 2024)
      .sort((a, b) => b.date - a.date)[0]?.amount || 2000;

    for (let month = 0; month <= Math.min(currentMonth + 1, 11); month++) {
      const isWinter = month >= 10 || month <= 2;
      const monthlyIncrease = isWinter ? 850 : 320;

      energyReadings.push({
        userId,
        type: 'gas',
        amount: lastGasReading2024 + (month * monthlyIncrease),
        date: new Date(2025, month, 1),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await db.collection('energies').insertMany(energyReadings);

    console.log(`[MongoDB] ✅ Database seeded for user ${userId}!`);
    console.log(`[MongoDB] 📊 Added ${energyReadings.length} energy readings`);
  } catch (error) {
    console.error('[MongoDB] ❌ Error seeding database:', error);
  } finally {
    await client.close();
  }
}

// Start the server
startMemoryMongo().catch(console.error);
