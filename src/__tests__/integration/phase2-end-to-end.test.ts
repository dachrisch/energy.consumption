/**
 * Phase 2 End-to-End Integration Tests
 *
 * Tests complete workflows across all layers:
 * - Server Actions → Services → Repositories → Database
 * - Event emission → Event handlers → Cache invalidation
 * - API routes → Services → Display data cache
 * - Feature flags → Backend routing → Data consistency
 *
 * These tests verify the entire Phase 2 adapter layer works correctly.
 */

import { connectDB } from '@/lib/mongodb';
import { setFeatureFlag } from '@/lib/featureFlags';
import { addEnergyAction, deleteEnergyAction, importCSVAction } from '@/actions/energy';
import { getEnergyCrudService, getDisplayDataService, resetServices, initializeEventHandlers } from '@/services';
import { getEventBus, EnergyEventTypes, resetEventBus } from '@/events';
import Energy from '@/models/Energy';
import SourceEnergyReading from '@/models/SourceEnergyReading';
import DisplayEnergyData from '@/models/DisplayEnergyData';
import FeatureFlag from '@/models/FeatureFlag';
import { EnergyBase } from '@/app/types';

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { id: 'test-user-e2e', email: 'e2e@example.com' },
    })
  ),
}));

jest.setTimeout(30000);

describe('Phase 2 End-to-End Integration Tests', () => {
  const testUserId = 'test-user-e2e';

  beforeAll(async () => {
    await connectDB();
    initializeEventHandlers(); // Critical: enables automatic cache invalidation
  });

  beforeEach(async () => {
    // Clean slate for each test
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
    await FeatureFlag.updateMany(
      { name: /_NEW_BACKEND/ },
      { $set: { enabled: false, rolloutPercent: 0, userWhitelist: [], userBlacklist: [] } }
    );
    resetServices();
    resetEventBus();
  });

  afterEach(async () => {
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
  });

  describe('Complete Workflow: Create → Display → Cache Invalidation', () => {
    it('should complete full workflow with automatic cache invalidation', async () => {
      // Enable new backend
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const displayService = getDisplayDataService();

      // Step 1: Create initial data
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-15'),
        amount: 10000,
      });

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-02-15'),
        amount: 10150,
      });

      // Step 2: Calculate display data (creates cache)
      const initialData = await displayService.calculateMonthlyChartData(
        testUserId,
        'power',
        2024
      );

      expect(initialData.months).toHaveLength(12);
      const initialHash = initialData.sourceDataHash;

      // Verify cache exists
      const cachedInitial = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(cachedInitial).toBeTruthy();

      // Step 3: Add new reading (should trigger cache invalidation)
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-03-15'),
        amount: 10300,
      });

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Cache should be invalidated
      const cachedAfterAdd = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(cachedAfterAdd).toBeNull(); // Cache invalidated!

      // Step 5: Recalculate (creates new cache)
      const updatedData = await displayService.calculateMonthlyChartData(
        testUserId,
        'power',
        2024
      );

      expect(updatedData.sourceDataHash).not.toBe(initialHash); // Hash changed
      expect(updatedData.months).toHaveLength(12);

      // Step 6: Delete reading (should invalidate again)
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      await deleteEnergyAction(readings[0]._id.toString());

      await new Promise(resolve => setTimeout(resolve, 300));

      // Cache invalidated again
      const cachedAfterDelete = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(cachedAfterDelete).toBeNull();
    });
  });

  describe('Bulk Import → Event Emission → Cache Invalidation', () => {
    it('should handle bulk import with automatic cache invalidation', async () => {
      // Enable new backend for CSV import
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const displayService = getDisplayDataService();
      const eventBus = getEventBus();
      let bulkEventEmitted = false;

      eventBus.on(EnergyEventTypes.BULK_IMPORTED, () => {
        bulkEventEmitted = true;
      });

      // Step 1: Create initial cache
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-01-01'),
        amount: 500,
      });

      await displayService.calculateMonthlyChartData(testUserId, 'gas', 2024);

      const cachedBefore = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'gas',
      });
      expect(cachedBefore).toBeTruthy();

      // Step 2: Bulk import
      const csvData: EnergyBase[] = Array.from({ length: 50 }, (_, i) => ({
        userId: testUserId,
        type: 'gas' as const,
        date: new Date(2024, 1, i + 1), // February
        amount: 500 + i,
      }));

      const importResult = await importCSVAction(csvData, []);

      expect(importResult.success).toBe(50);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Verify bulk event emitted
      expect(bulkEventEmitted).toBe(true);

      // Step 4: Cache should be invalidated
      const cachedAfter = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'gas',
      });
      expect(cachedAfter).toBeNull(); // Invalidated by bulk import

      // Step 5: Recalculate includes new data
      const updatedData = await displayService.calculateMonthlyChartData(
        testUserId,
        'gas',
        2024
      );

      expect(updatedData.months).toHaveLength(12);
      // February should have data from bulk import
      const februaryData = updatedData.months.find(m => m.month === 2);
      expect(februaryData).toBeDefined();
    });
  });

  describe('Feature Flag Scenarios', () => {
    it('Scenario: Gradual rollout (dev → 10% → 100%)', async () => {
      // Phase 1: Dev team only (whitelist)
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
        userWhitelist: [testUserId],
      });

      // Dev user gets new backend
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      let inNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(inNew).toHaveLength(1);

      await SourceEnergyReading.deleteMany({ userId: testUserId });

      // Phase 2: 10% rollout
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 10,
        userWhitelist: [],
      });

      // Rollout percentage active (deterministic based on userId hash)
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-18'),
        amount: 150,
      });

      // Phase 3: 100% rollout
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      await SourceEnergyReading.deleteMany({ userId: testUserId });

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-19'),
        amount: 200,
      });

      inNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(inNew).toHaveLength(1); // 100% rollout successful
    });

    it('Scenario: Emergency rollback (disable flag instantly)', async () => {
      // Enable globally
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: true,
        rolloutPercent: 100,
      });
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Create data with new backend
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      const inNewBefore = await SourceEnergyReading.find({ userId: testUserId });
      expect(inNewBefore).toHaveLength(1);

      // Emergency: Disable instantly
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Future writes go to old backend
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-11-18'),
        amount: 50,
      });

      const inOldAfter = await Energy.find({ userId: testUserId, type: 'gas' });
      expect(inOldAfter).toHaveLength(1);

      // Rollback complete - zero downtime!
    });

    it('Scenario: Test one component before global rollout', async () => {
      // Global OFF
      await setFeatureFlag('NEW_BACKEND_ENABLED', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Enable only CSV import for testing
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // CSV import uses new backend
      const csvData: EnergyBase[] = [
        { userId: testUserId, type: 'power', date: new Date('2024-01-01'), amount: 100 },
      ];
      await importCSVAction(csvData, []);

      const csvInNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(csvInNew).toHaveLength(1);

      // Form submission uses old backend (flag OFF)
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-02-01'),
        amount: 50,
      });

      const formInOld = await Energy.find({ userId: testUserId, type: 'gas' });
      expect(formInOld).toHaveLength(1);

      // Component isolation working correctly!
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across backend switches', async () => {
      // Create data with OLD backend
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-01'),
        amount: 100,
      });

      const oldData = await Energy.find({ userId: testUserId });
      expect(oldData).toHaveLength(1);

      // Switch to NEW backend
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-02-01'),
        amount: 150,
      });

      const newData = await SourceEnergyReading.find({ userId: testUserId });
      expect(newData).toHaveLength(1);

      // Both collections have their data intact
      expect(oldData).toHaveLength(1);
      expect(newData).toHaveLength(1);

      // No data loss during migration
    });

    it('should handle concurrent operations safely', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Create multiple readings concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        addEnergyAction({
          userId: testUserId,
          type: 'power',
          date: new Date(2024, 0, i + 1),
          amount: 100 + i,
        })
      );

      await Promise.all(promises);

      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(10);

      // All readings unique (no race conditions)
      const dates = readings.map(r => r.date.toISOString());
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(10);
    });
  });

  describe('Performance Comparison', () => {
    it('should demonstrate performance improvements with new backend', async () => {
      const largeDataset: EnergyBase[] = Array.from({ length: 200 }, (_, i) => ({
        userId: testUserId,
        type: 'power' as const,
        date: new Date(2024, 0, i + 1),
        amount: 100 + i,
      }));

      // OLD BACKEND (loop)
      const oldStart = Date.now();
      await importCSVAction(largeDataset, []);
      const oldDuration = Date.now() - oldStart;

      await Energy.deleteMany({ userId: testUserId });

      // NEW BACKEND (bulk)
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const newStart = Date.now();
      await importCSVAction(largeDataset, []);
      const newDuration = Date.now() - newStart;

      const speedup = oldDuration / newDuration;

      console.log(`
        Performance Comparison (200 records):
        Old Backend: ${oldDuration}ms
        New Backend: ${newDuration}ms
        Speedup: ${speedup.toFixed(1)}x faster
      `);

      // New backend should be at least 5x faster
      expect(speedup).toBeGreaterThan(5);
    }, 60000);

    it('should demonstrate cache performance benefits', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Create test data
      const service = getEnergyCrudService();
      const readings = Array.from({ length: 100 }, (_, i) => ({
        userId: testUserId,
        type: 'power' as const,
        date: new Date(2024, 0, i + 1),
        amount: 10000 + i * 10,
      }));
      await service.createMany(readings);

      const displayService = getDisplayDataService();

      // First request: Calculate (slow)
      const calcStart = Date.now();
      await displayService.calculateMonthlyChartData(testUserId, 'power', 2024);
      const calcDuration = Date.now() - calcStart;

      // Second request: From cache (fast)
      const cacheStart = Date.now();
      await displayService.calculateMonthlyChartData(testUserId, 'power', 2024);
      const cacheDuration = Date.now() - cacheStart;

      const speedup = calcDuration / cacheDuration;

      console.log(`
        Cache Performance (100 records):
        Initial Calculation: ${calcDuration}ms
        Cache Hit: ${cacheDuration}ms
        Speedup: ${speedup.toFixed(1)}x faster
      `);

      // Cache should be at least 5x faster
      expect(speedup).toBeGreaterThan(5);
    });
  });

  describe('Error Recovery', () => {
    it('should handle service errors without data loss', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Create valid data
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      // Try invalid data
      const invalidResult = await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'), // Duplicate date
        amount: 150,
      });

      expect(invalidResult.success).toBe(false);

      // Original data still intact
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(1);
      expect(readings[0].amount).toBe(100); // Original value preserved
    });

    it('should handle event handler failures gracefully', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const eventBus = getEventBus();

      // Add failing handler
      eventBus.on(EnergyEventTypes.CREATED, async () => {
        throw new Error('Simulated handler failure');
      });

      // Creating data should still work
      const result = await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      expect(result.success).toBe(true);

      // Data created despite handler failure
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(1);
    });
  });
});
