/**
 * Backend Flags Integration Tests
 *
 * Tests feature flag integration with database and real feature flag models.
 * Verifies flag routing logic with actual MongoDB operations.
 */

import { checkBackendFlag, initializeBackendFlags, getAllBackendFlags } from '../backendFlags';
import { setFeatureFlag } from '../featureFlags';
import FeatureFlag from '@/models/FeatureFlag';

// Set longer timeout for database operations
jest.setTimeout(30000);

describe('Backend Flags Integration Tests', () => {
  beforeAll(async () => {
    // MongoDB connection is handled by jest.integration.setup.ts
    // Clean up any existing test flags
    await FeatureFlag.deleteMany({ name: /TEST_/ });
    await FeatureFlag.deleteMany({ name: /_NEW_BACKEND/ });
  });

  afterAll(async () => {
    // Clean up test data
    await FeatureFlag.deleteMany({ name: /TEST_/ });
    await FeatureFlag.deleteMany({ name: /_NEW_BACKEND/ });
  });

  describe('initializeBackendFlags()', () => {
    it('should create all default backend flags in database', async () => {
      // Initialize flags
      await initializeBackendFlags();

      // Verify all flags exist in database
      const globalFlag = await FeatureFlag.findOne({ name: 'NEW_BACKEND_ENABLED' });
      expect(globalFlag).toBeTruthy();
      expect(globalFlag?.enabled).toBe(false);
      expect(globalFlag?.rolloutPercent).toBe(0);

      const dashboardFlag = await FeatureFlag.findOne({ name: 'DASHBOARD_NEW_BACKEND' });
      expect(dashboardFlag).toBeTruthy();
      expect(dashboardFlag?.enabled).toBe(false);

      const chartsFlag = await FeatureFlag.findOne({ name: 'CHARTS_NEW_BACKEND' });
      expect(chartsFlag).toBeTruthy();

      const csvFlag = await FeatureFlag.findOne({ name: 'CSV_IMPORT_NEW_BACKEND' });
      expect(csvFlag).toBeTruthy();

      const formFlag = await FeatureFlag.findOne({ name: 'FORM_NEW_BACKEND' });
      expect(formFlag).toBeTruthy();
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      // Call twice
      await initializeBackendFlags();
      await initializeBackendFlags();

      // Should still have only one of each flag
      const globalFlags = await FeatureFlag.find({ name: 'NEW_BACKEND_ENABLED' });
      expect(globalFlags).toHaveLength(1);
    });
  });

  describe('checkBackendFlag() with real database', () => {
    beforeEach(async () => {
      // Reset all flags to disabled
      await FeatureFlag.updateMany(
        { name: /_NEW_BACKEND/ },
        { $set: { enabled: false, rolloutPercent: 0, userWhitelist: [], userBlacklist: [] } }
      );
    });

    it('should return false when global flag disabled', async () => {
      const result = await checkBackendFlag(undefined, 'test-user-1');
      expect(result).toBe(false);
    });

    it('should return true when global flag enabled for user', async () => {
      // Enable global flag with 100% rollout
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });

      const result = await checkBackendFlag(undefined, 'test-user-1');
      expect(result).toBe(true);
    });

    it('should respect component flag override (component ON, global OFF)', async () => {
      // Global OFF
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Dashboard component ON
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const globalResult = await checkBackendFlag(undefined, 'test-user-1');
      expect(globalResult).toBe(false);

      const dashboardResult = await checkBackendFlag('dashboard', 'test-user-1');
      expect(dashboardResult).toBe(true); // Component flag wins
    });

    it('should respect component flag override (component OFF, global ON)', async () => {
      // Global ON
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Dashboard component OFF
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      const globalResult = await checkBackendFlag(undefined, 'test-user-1');
      expect(globalResult).toBe(true);

      const dashboardResult = await checkBackendFlag('dashboard', 'test-user-1');
      expect(dashboardResult).toBe(false); // Component flag wins
    });

    it('should support percentage rollout', async () => {
      // Enable global flag with 50% rollout
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 50,
      });

      // Test multiple users - some should be enabled, some disabled
      const results = await Promise.all([
        checkBackendFlag(undefined, 'user-a'),
        checkBackendFlag(undefined, 'user-b'),
        checkBackendFlag(undefined, 'user-c'),
        checkBackendFlag(undefined, 'user-d'),
        checkBackendFlag(undefined, 'user-e'),
      ]);

      // At least one should be true, at least one should be false
      expect(results.some(r => r === true)).toBe(true);
      expect(results.some(r => r === false)).toBe(true);
    });

    it('should support user whitelist', async () => {
      // Global OFF
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
        userWhitelist: ['whitelisted-user'],
      });

      const whitelistedResult = await checkBackendFlag(undefined, 'whitelisted-user');
      expect(whitelistedResult).toBe(true);

      const regularResult = await checkBackendFlag(undefined, 'regular-user');
      expect(regularResult).toBe(false);
    });

    it('should support user blacklist', async () => {
      // Global ON
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
        userBlacklist: ['blacklisted-user'],
      });

      const blacklistedResult = await checkBackendFlag(undefined, 'blacklisted-user');
      expect(blacklistedResult).toBe(false);

      const regularResult = await checkBackendFlag(undefined, 'regular-user');
      expect(regularResult).toBe(true);
    });
  });

  describe('getAllBackendFlags()', () => {
    it('should retrieve all backend flags from database', async () => {
      await initializeBackendFlags();

      const flags = await getAllBackendFlags();

      expect(flags).toHaveLength(6);
      expect(flags.map(f => f.name)).toEqual(
        expect.arrayContaining([
          'NEW_BACKEND_ENABLED',
          'DASHBOARD_NEW_BACKEND',
          'CHARTS_NEW_BACKEND',
          'TIMELINE_NEW_BACKEND',
          'CSV_IMPORT_NEW_BACKEND',
          'FORM_NEW_BACKEND',
        ])
      );
    });

    it('should return current flag states from database', async () => {
      // Enable one flag
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 75,
      });

      const flags = await getAllBackendFlags();
      const dashboardFlag = flags.find(f => f.name === 'DASHBOARD_NEW_BACKEND');

      expect(dashboardFlag?.enabled).toBe(true);
      expect(dashboardFlag?.rolloutPercent).toBe(75);
    });
  });

  describe('Real-world scenarios', () => {
    beforeEach(async () => {
      // Reset all flags
      await FeatureFlag.updateMany(
        { name: /_NEW_BACKEND/ },
        { $set: { enabled: false, rolloutPercent: 0, userWhitelist: [], userBlacklist: [] } }
      );
    });

    it('Scenario: Gradual rollout from 0% to 100%', async () => {
      const testUser = 'rollout-test-user';

      // 0% - Should be disabled
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 0,
      });
      expect(await checkBackendFlag(undefined, testUser)).toBe(false);

      // 50% - May or may not be enabled (deterministic based on user hash)
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 50,
      });
      const result50 = await checkBackendFlag(undefined, testUser);
      expect(typeof result50).toBe('boolean');

      // 100% - Should be enabled
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });
      expect(await checkBackendFlag(undefined, testUser)).toBe(true);
    });

    it('Scenario: Enable for dev team only (whitelist)', async () => {
      const devUser = 'dev@example.com';
      const regularUser = 'user@example.com';

      // Global OFF, whitelist dev team
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
        userWhitelist: [devUser],
      });

      expect(await checkBackendFlag(undefined, devUser)).toBe(true);
      expect(await checkBackendFlag(undefined, regularUser)).toBe(false);
    });

    it('Scenario: Emergency disable for specific user (blacklist)', async () => {
      const problematicUser = 'problematic-user';
      const regularUser = 'regular-user';

      // Global ON, blacklist one user
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
        userBlacklist: [problematicUser],
      });

      expect(await checkBackendFlag(undefined, problematicUser)).toBe(false);
      expect(await checkBackendFlag(undefined, regularUser)).toBe(true);
    });

    it('Scenario: Enable globally but disable Dashboard (component override)', async () => {
      const testUser = 'test-user';

      // Global ON
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Dashboard OFF (emergency disable)
      await setFeatureFlag('DASHBOARD_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Charts should use new backend
      expect(await checkBackendFlag('charts', testUser)).toBe(true);

      // Dashboard should use old backend (emergency disabled)
      expect(await checkBackendFlag('dashboard', testUser)).toBe(false);
    });

    it('Scenario: Test one component before global rollout', async () => {
      const testUser = 'test-user';

      // Global OFF (not ready yet)
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Enable CSV import for testing
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // CSV import uses new backend
      expect(await checkBackendFlag('csv_import', testUser)).toBe(true);

      // Everything else uses old backend
      expect(await checkBackendFlag('dashboard', testUser)).toBe(false);
      expect(await checkBackendFlag('charts', testUser)).toBe(false);
      expect(await checkBackendFlag('form', testUser)).toBe(false);
    });

    it('Scenario: Instant rollback via flag disable', async () => {
      const testUser = 'test-user';

      // Enable globally
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });
      expect(await checkBackendFlag(undefined, testUser)).toBe(true);

      // Emergency: Disable instantly
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
      });
      expect(await checkBackendFlag(undefined, testUser)).toBe(false);

      // Rollback complete - zero downtime
    });
  });

  describe('Performance', () => {
    it('should check flags quickly (<100ms)', async () => {
      await initializeBackendFlags();

      const start = Date.now();
      await checkBackendFlag('dashboard', 'test-user');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent flag checks', async () => {
      await initializeBackendFlags();

      const promises = Array.from({ length: 10 }, (_, i) =>
        checkBackendFlag('dashboard', `user-${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(result => expect(typeof result).toBe('boolean'));
    });
  });
});
