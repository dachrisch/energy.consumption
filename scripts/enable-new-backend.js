/**
 * Helper script to enable new backend feature flags for testing
 *
 * Usage:
 *   node scripts/enable-new-backend.js [--all|--forms|--csv|--dashboard|--status]
 *
 * Examples:
 *   node scripts/enable-new-backend.js --all        # Enable all flags
 *   node scripts/enable-new-backend.js --forms      # Enable just forms
 *   node scripts/enable-new-backend.js --status     # Check current status
 */

const mongoose = require('mongoose');

// MongoDB connection
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy_consumption';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

// FeatureFlag model (simplified)
const FeatureFlagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  enabled: { type: Boolean, default: false },
  rolloutPercent: { type: Number, default: 0 },
  componentOverride: { type: Boolean, default: false },
  whitelist: [String],
  blacklist: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const FeatureFlag = mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', FeatureFlagSchema);

// Set feature flag
async function setFeatureFlag(name, options) {
  return await FeatureFlag.findOneAndUpdate(
    { name },
    {
      ...options,
      name,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

// Get feature flag
async function getFeatureFlag(name) {
  return await FeatureFlag.findOne({ name });
}

function showHelp() {
  console.log(`
🎛️  New Backend Feature Flag Manager

Usage:
  node scripts/enable-new-backend.js [option]

Options:
  --all           Enable ALL new backend flags (100% rollout)
  --forms         Enable FORM_NEW_BACKEND only
  --csv           Enable CSV_IMPORT_NEW_BACKEND only
  --dashboard     Enable DASHBOARD_NEW_BACKEND only
  --charts        Enable CHARTS_NEW_BACKEND only
  --disable-all   Disable ALL new backend flags (rollback)
  --status        Show current flag status
  --help          Show this help message

Examples:
  # Enable all flags for testing
  node scripts/enable-new-backend.js --all

  # Enable just forms to test add/edit operations
  node scripts/enable-new-backend.js --forms

  # Check current status
  node scripts/enable-new-backend.js --status

  # Rollback to old backend
  node scripts/enable-new-backend.js --disable-all

After enabling flags:
  ✅ New data → SourceEnergyReading collection
  ✅ Display cache → DisplayEnergyData collection
  ✅ Events emitted for automatic cache invalidation
  ✅ 10-100x performance improvement for bulk operations

Collections:
  OLD: Energy (used when flags OFF)
  NEW: SourceEnergyReading (used when flags ON)
  NEW: DisplayEnergyData (cache for charts/tables)

Important:
  - Restart Next.js dev server after changing flags
  - Both backends can coexist (dual backend architecture)
  - Instant rollback via --disable-all
  `);
  process.exit(0);
}

const args = process.argv.slice(2);
const mode = args[0] || '--help';

async function enableFlags() {
  // Show help without requiring DB connection
  if (mode === '--help') {
    showHelp();
    return;
  }

  // Connect to DB for all other operations
  await connectDB();

  switch (mode) {
    case '--all':
      console.log('🚀 Enabling ALL new backend flags...\n');
      await setFeatureFlag('NEW_BACKEND_ENABLED', { enabled: true, rolloutPercent: 100 });
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      await setFeatureFlag('CHARTS_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      await setFeatureFlag('TIMELINE_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      await setFeatureFlag('FORM_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      console.log('✅ All flags enabled (100% rollout)');
      console.log('\n📝 Next steps:');
      console.log('   1. Restart your Next.js dev server');
      console.log('   2. Add new energy data via forms or CSV import');
      console.log('   3. Check MongoDB collections:');
      console.log('      - SourceEnergyReading (new source data)');
      console.log('      - DisplayEnergyData (cached display data)');
      break;

    case '--forms':
      console.log('📝 Enabling FORM new backend...\n');
      await setFeatureFlag('FORM_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      console.log('✅ Form flag enabled');
      console.log('\n📝 Now add/edit operations will use:');
      console.log('   - SourceEnergyReading collection');
      console.log('   - Event emission (automatic cache invalidation)');
      break;

    case '--csv':
      console.log('📊 Enabling CSV IMPORT new backend...\n');
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      console.log('✅ CSV import flag enabled');
      console.log('\n📝 CSV imports will now:');
      console.log('   - Use bulk operations (10-100x faster)');
      console.log('   - Write to SourceEnergyReading collection');
      console.log('   - Emit BULK_IMPORTED event');
      break;

    case '--dashboard':
      console.log('📈 Enabling DASHBOARD new backend...\n');
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      console.log('✅ Dashboard flag enabled');
      break;

    case '--charts':
      console.log('📉 Enabling CHARTS new backend...\n');
      await setFeatureFlag('CHARTS_NEW_BACKEND', { enabled: true, rolloutPercent: 100 });
      console.log('✅ Charts flag enabled');
      break;

    case '--disable-all':
      console.log('⛔ Disabling ALL new backend flags...\n');
      await setFeatureFlag('NEW_BACKEND_ENABLED', { enabled: false, rolloutPercent: 0 });
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', { enabled: false, rolloutPercent: 0 });
      await setFeatureFlag('CHARTS_NEW_BACKEND', { enabled: false, rolloutPercent: 0 });
      await setFeatureFlag('TIMELINE_NEW_BACKEND', { enabled: false, rolloutPercent: 0 });
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', { enabled: false, rolloutPercent: 0 });
      await setFeatureFlag('FORM_NEW_BACKEND', { enabled: false, rolloutPercent: 0 });
      console.log('✅ All flags disabled (rollback to old backend)');
      console.log('\n📝 Data will now go to Energy collection (old backend)');
      break;

    case '--status':
      console.log('📋 Current feature flag status:\n');
      const flags = [
        'NEW_BACKEND_ENABLED',
        'DASHBOARD_NEW_BACKEND',
        'CHARTS_NEW_BACKEND',
        'TIMELINE_NEW_BACKEND',
        'CSV_IMPORT_NEW_BACKEND',
        'FORM_NEW_BACKEND',
      ];

      console.log('Flag Name                          Status    Rollout');
      console.log('─'.repeat(60));

      // Fetch all flags first
      const flagResults = [];
      for (const name of flags) {
        const flag = await getFeatureFlag(name);
        flagResults.push({ name, flag });
      }

      // Display results
      for (const { name, flag } of flagResults) {
        const status = flag?.enabled ? '✅ ON ' : '❌ OFF';
        const rollout = flag?.rolloutPercent || 0;
        console.log(`${name.padEnd(33)} ${status}    ${rollout}%`);
      }

      console.log('\n📊 Collection Usage:');

      // Check if any flags are enabled
      const anyEnabled = flagResults.some(({ flag }) => flag?.enabled);

      if (anyEnabled) {
        console.log('   ✅ NEW: SourceEnergyReading (source data)');
        console.log('   ✅ NEW: DisplayEnergyData (cache)');
        console.log('   ⚠️  OLD: Energy (still readable for historical data)');
      } else {
        console.log('   ✅ OLD: Energy (all data here)');
        console.log('   ⚠️  NEW: SourceEnergyReading (not used, flags OFF)');
        console.log('   ⚠️  NEW: DisplayEnergyData (not used, flags OFF)');
      }
      console.log('');
      break;

    default:
      showHelp();
      return; // Exit early without closing connection
  }

  // Only close connection if we actually connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
}

enableFlags().catch((error) => {
  console.error('❌ Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('  1. Make sure MongoDB is running');
  console.error('  2. Check MONGODB_URI environment variable');
  console.error('  3. Verify database connection');
  process.exit(1);
});
