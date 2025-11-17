/**
 * Feature Flag Initialization Script
 *
 * Creates initial feature flags for Phase 2 frontend adapter layer.
 * All flags start DISABLED (enabled: false, rolloutPercent: 0).
 *
 * Usage:
 *   import { initializePhase2FeatureFlags } from '@/scripts/initializeFeatureFlags';
 *   await initializePhase2FeatureFlags();
 *
 * Or run as standalone script:
 *   npx tsx src/scripts/initializeFeatureFlags.ts
 */

import { setFeatureFlag } from '@/lib/featureFlags';

/**
 * Phase 2 feature flags for gradual frontend migration
 */
const PHASE2_FLAGS = [
  {
    name: 'NEW_BACKEND_ENABLED',
    enabled: false,
    rolloutPercent: 0,
    description: 'Master switch for new backend (must be ON for component flags to work)',
  },
  {
    name: 'DASHBOARD_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'Dashboard summary cards use new backend',
  },
  {
    name: 'ENERGY_TABLE_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'Energy table component uses new backend',
  },
  {
    name: 'TIMELINE_SLIDER_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'Timeline slider histogram uses new backend',
  },
  {
    name: 'MONTHLY_CHARTS_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'Monthly meter reading charts use new backend',
  },
  {
    name: 'CSV_IMPORT_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'CSV import functionality uses new backend',
  },
  {
    name: 'ENERGY_FORMS_NEW_BACKEND',
    enabled: false,
    rolloutPercent: 0,
    description: 'Energy add/edit forms use new backend',
  },
];

/**
 * Initialize all Phase 2 feature flags
 * Creates flags if they don't exist, leaves existing flags unchanged
 *
 * @returns Number of flags initialized
 */
export async function initializePhase2FeatureFlags(): Promise<number> {
  console.log('Initializing Phase 2 feature flags...');

  let count = 0;
  for (const flag of PHASE2_FLAGS) {
    try {
      await setFeatureFlag(flag.name, {
        enabled: flag.enabled,
        rolloutPercent: flag.rolloutPercent,
        description: flag.description,
        userWhitelist: [],
        userBlacklist: [],
      });
      console.log(`✓ Initialized: ${flag.name}`);
      count++;
    } catch (error) {
      console.error(`✗ Failed to initialize ${flag.name}:`, error);
    }
  }

  console.log(`\nInitialized ${count}/${PHASE2_FLAGS.length} feature flags`);
  return count;
}

/**
 * Run as standalone script if executed directly
 */
if (require.main === module) {
  initializePhase2FeatureFlags()
    .then((count) => {
      console.log(`\nSuccess! ${count} flags initialized.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError initializing feature flags:', error);
      process.exit(1);
    });
}
