/**
 * Migration script: Old Energy collection -> New SourceEnergyReading collection
 * 
 * Usage:
 *   node scripts/migrate-to-new-backend.js
 */

const mongoose = require('mongoose');

// MongoDB connection
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy_consumption';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

// Old model
const Energy = mongoose.models.Energy || mongoose.model('Energy', new mongoose.Schema({
  userId: String,
  type: String,
  amount: Number,
  date: Date
}), 'energies');

// New model
const SourceEnergyReading = mongoose.models.SourceEnergyReading || mongoose.model('SourceEnergyReading', new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['power', 'gas'], required: true },
  amount: { type: Number, required: true },
  unit: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}), 'sourceenergyreadings');

async function migrate() {
  console.log('🚀 Starting migration to new backend...');
  await connectDB();

  const oldReadings = await Energy.find({});
  console.log(`Found ${oldReadings.length} readings in 'energies' collection.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const old of oldReadings) {
    // Check if already exists in new collection
    const exists = await SourceEnergyReading.findOne({
      userId: old.userId,
      date: old.date,
      type: old.type
    });

    if (exists) {
      skippedCount++;
      continue;
    }

    const newReading = new SourceEnergyReading({
      userId: old.userId,
      date: old.date,
      type: old.type,
      amount: old.amount,
      unit: old.type === 'power' ? 'kWh' : 'm³',
      createdAt: new Date()
    });

    await newReading.save();
    migratedCount++;
  }

  console.log(`✅ Migration complete!`);
  console.log(`   - Migrated: ${migratedCount}`);
  console.log(`   - Skipped (already exist): ${skippedCount}`);
  console.log(`   - Total in new collection: ${await SourceEnergyReading.countDocuments({})}`);

  await mongoose.connection.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
