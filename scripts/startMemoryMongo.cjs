const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function start() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: 'energy_consumption_solid'
    }
  });
  const uri = mongo.getUri();
  console.log('MongoDB Memory Server started at:', uri);
  
  const envContent = `MONGODB_URI=${uri}\nJWT_SECRET=dev-secret-123\n`;
  fs.writeFileSync('.env.local', envContent);
  console.log('Updated .env.local');

  // Create test user
  try {
    await mongoose.connect(uri);
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const testEmail = 'test@example.com';
    const existingUser = await User.findOne({ email: testEmail });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Test User',
        email: testEmail,
        password: hashedPassword
      });
      console.log(`Created test user: ${testEmail}`);
    } else {
      console.log(`Test user ${testEmail} already exists`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to create test user:', err);
  }

  // Spawn Vite with the URI explicitly in the environment
  const vite = spawn('npm', ['run', 'vite-dev'], { 
    stdio: 'inherit', 
    shell: true,
    env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'dev-secret-123' }
  });

  vite.on('close', (code) => {
    console.log(`Vite exited with code ${code}`);
    mongo.stop();
    process.exit(code);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
