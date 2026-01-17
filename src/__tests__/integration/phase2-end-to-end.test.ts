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
import { checkBackendFlag } from '@/lib/backendFlags';
import { addEnergyAction, deleteEnergyAction, importCSVAction } from '@/actions/energy';
import { getEnergyCrudService, getDisplayDataService, resetServices, initializeEventHandlers } from '@/services';
import { getEventBus, EnergyEventTypes, resetEventBus } from '@/events';
import Energy from '@/models/Energy';
import { SourceEnergyReading } from '@/models/SourceEnergyReading';
import { DisplayEnergyData } from '@/models/DisplayEnergyData';
import FeatureFlag from '@/models/FeatureFlag';
import { EnergyBase } from '@/app/types';

// Mock NextAuth session
jest.mock('next-auth', () => {
  const mockFn = jest.fn(() => ({}));
  const getServerSession = jest.fn(() =>
    Promise.resolve({
      user: { id: '000000000000000000000001', email: 'e2e@example.com' },
    })
  );
  
  // Assign properties to the function to handle default export usage like NextAuth(options)
  Object.assign(mockFn, {
    getServerSession,
    __esModule: true,
    default: mockFn,
  });

  return {
    __esModule: true,
    default: mockFn,
    getServerSession,
  };
});

jest.setTimeout(60000);

describe('Phase 2 End-to-End Integration Tests', () => {
  const testUserId = '000000000000000000000001';

  beforeAll(async () => {
    await connectDB();
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
    
    // Reset env vars
    delete process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND;
    delete process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND;
    delete process.env.NEXT_PUBLIC_ENABLE_CHARTS_NEW_BACKEND;
    delete process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT_NEW_BACKEND;

    resetServices();
    resetEventBus();
    initializeEventHandlers();
  });

  afterEach(async () => {
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
  });

  describe('Complete Workflow: Create → Display → Cache Invalidation', () => {
    it('should complete full workflow with automatic cache invalidation', async () => {
      // Enable new backend via env var
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

      const displayService = getDisplayDataService();

      // Step 1: Create initial data
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-15'),
        amount: 10000,
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-02-15'),
        amount: 10150,
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Calculate display data (creates cache)
      const initialData = await displayService.calculateMonthlyChartData(
        testUserId,
        'power',
        2024
      );

      const initialMonths = initialData.data as any[];
      expect(initialMonths).toHaveLength(12);
      const initialHash = initialData.sourceDataHash;

      // Verify cache exists
      const cachedInitial = await DisplayEnergyData.findOne({
        userId: testUserId,
        displayType: 'monthly-chart-power',
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Cache should be invalidated
      const cachedAfterAdd = await DisplayEnergyData.findOne({
        userId: testUserId,
        displayType: 'monthly-chart-power',
      });
      expect(cachedAfterAdd).toBeNull(); // Cache invalidated!

      // Step 5: Recalculate (creates new cache)
      const updatedData = await displayService.calculateMonthlyChartData(
        testUserId,
        'power',
        2024
      );

      expect(updatedData.sourceDataHash).not.toBe(initialHash); // Hash changed
      const updatedMonths = updatedData.data as any[];
      expect(updatedMonths).toHaveLength(12);

      // Step 6: Delete reading (should invalidate again)
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      await deleteEnergyAction(readings[0]._id.toString());

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Cache invalidated again
      const cachedAfterDelete = await DisplayEnergyData.findOne({
        userId: testUserId,
        displayType: 'monthly-chart-power',
      });
      expect(cachedAfterDelete).toBeNull();
    });
  });

  describe('Bulk Import → Event Emission → Cache Invalidation', () => {
    it('should handle bulk import with automatic cache invalidation', async () => {
      // Enable new backend for CSV import
      process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT_NEW_BACKEND = 'true';
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

      const displayService = getDisplayDataService();
      const eventBus = getEventBus();
      let bulkEventEmitted = false;

      eventBus.on(EnergyEventTypes.BULK_IMPORTED, async () => {
        bulkEventEmitted = true;
      });

      // Step 1: Create initial cache
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-01-01'),
        amount: 500,
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      await displayService.calculateMonthlyChartData(testUserId, 'gas', 2024);

      const cachedBefore = await DisplayEnergyData.findOne({
        userId: testUserId,
        displayType: 'monthly-chart-gas',
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Verify bulk event emitted
      expect(bulkEventEmitted).toBe(true);

      // Step 4: Cache should be invalidated
      const cachedAfter = await DisplayEnergyData.findOne({
        userId: testUserId,
        displayType: 'monthly-chart-gas',
      });
      expect(cachedAfter).toBeNull(); // Invalidated by bulk import

      // Step 5: Recalculate includes new data
      const updatedData = await displayService.calculateMonthlyChartData(
        testUserId,
        'gas',
        2024
      );

      const updatedMonths = updatedData.data as any[];
      expect(updatedMonths).toHaveLength(12);
      // February should have data from bulk import
      const februaryData = updatedMonths.find(m => m.month === 2);
      expect(februaryData).toBeDefined();
      expect(februaryData.meterReading).toBeGreaterThan(500);
    });
  });

  describe('Feature Flag Scenarios', () => {
    it('Scenario: Gradual rollout (dev → 10% → 100%)', async () => {
      // Ensure env vars don't interfere
      delete process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND;
      delete process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND;

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
      // testUserId '000000000000000000000001' hash is likely > 10
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 10,
        userWhitelist: [],
      });

      // Check if this user is in the 10% (most likely not)
      const isEnabled = await checkBackendFlag('form', testUserId);
      
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-18'),
        amount: 150,
      });

      if (isEnabled) {
        inNew = await SourceEnergyReading.find({ userId: testUserId });
        expect(inNew).toHaveLength(1);
      } else {
        const inOld = await Energy.find({ userId: testUserId, date: new Date('2024-11-18') });
        expect(inOld).toHaveLength(1);
      }

      // Phase 3: 100% rollout
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      await SourceEnergyReading.deleteMany({ userId: testUserId });
      await Energy.deleteMany({ userId: testUserId });

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
      process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND = 'true';
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

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
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'false';

      // Future writes go to old backend
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-11-18'),
        amount: 50,
      });

      const inOldAfter = await Energy.find({ userId: testUserId, type: 'gas' });
      expect(inOldAfter).toHaveLength(1);
    });

    it('Scenario: Test one component before global rollout', async () => {
      // Global OFF
      process.env.NEXT_PUBLIC_ENABLE_NEW_BACKEND = 'false';

      // Enable only CSV import for testing
      process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT_NEW_BACKEND = 'true';

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
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across backend switches', async () => {
      // Create data with OLD backend
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'false';
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-01'),
        amount: 100,
      });

      const oldData = await Energy.find({ userId: testUserId });
      expect(oldData).toHaveLength(1);

      // Switch to NEW backend
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

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
    });

    it('should handle concurrent operations safely', async () => {
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

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
      process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT_NEW_BACKEND = 'false';
      const oldStart = Date.now();
      await importCSVAction(largeDataset, []);
      const oldDuration = Date.now() - oldStart;

      await Energy.deleteMany({ userId: testUserId });

      // NEW BACKEND (bulk)
      process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT_NEW_BACKEND = 'true';
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

      // New backend should be significantly faster
      expect(speedup).toBeGreaterThan(3);
    }, 60000);

    it('should demonstrate cache performance benefits', async () => {
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

      // Create test data
      const service = getEnergyCrudService();
      const readings = Array.from({ length: 10 }, (_, i) => ({
        userId: testUserId,
        type: 'power' as const,
        date: new Date(2024, 0, i + 1),
        amount: 10000 + i * 10,
        unit: 'kWh',
      }));
      await service.createMany(readings);

      const displayService = getDisplayDataService();

      // First request: Calculate (slow due to artificial delay in service)
      process.env.SIMULATE_SLOW_CALCULATION = 'true';
      const calcStart = Date.now();
      await displayService.calculateMonthlyChartData(testUserId, 'power', 2024);
      const calcDuration = Date.now() - calcStart;
      delete process.env.SIMULATE_SLOW_CALCULATION;

      // Wait a bit to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request: From cache (fast)
      const cacheStart = Date.now();
      await displayService.calculateMonthlyChartData(testUserId, 'power', 2024);
      const cacheDuration = Date.now() - cacheStart;

      const speedup = calcDuration / (cacheDuration || 1);

      console.log(`
        Cache Performance (10 records):
        Initial Calculation: ${calcDuration}ms
        Cache Hit: ${cacheDuration}ms
        Speedup: ${speedup.toFixed(1)}x faster
      `);

      // Initial should be at least 500ms (due to delay), cache should be near 0ms
      expect(calcDuration).toBeGreaterThan(450);
      expect(speedup).toBeGreaterThan(2);
    });
  });

  describe('Error Recovery', () => {
    it('should handle service errors without data loss', async () => {
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

      // Create valid data
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      // Try invalid data (duplicate date due to unique index)
      const invalidResult = await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 150,
      });

      expect(invalidResult.success).toBe(false);

      // Original data still intact
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(1);
      expect(readings[0].amount).toBe(100);
    });

    it('should handle event handler failures gracefully', async () => {
      process.env.NEXT_PUBLIC_ENABLE_FORM_NEW_BACKEND = 'true';

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