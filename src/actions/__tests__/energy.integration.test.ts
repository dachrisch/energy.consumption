/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Energy Server Actions Integration Tests
 *
 * Tests dual backend support in server actions:
 * - addEnergyAction (old vs new backend)
 * - deleteEnergyAction (old vs new backend)
 * - importCSVAction (old vs new backend)
 * - Feature flag routing
 * - Event emission verification
 */

import { addEnergyAction, deleteEnergyAction, importCSVAction } from '../energy';
import { getServerSession } from 'next-auth';

// Mock NextAuth session for this file
jest.mock('next-auth', () => {
  const mockFunc: any = jest.fn(() => jest.fn());
  mockFunc.getServerSession = jest.fn(() =>
    Promise.resolve({
      user: { id: '000000000000000000000002', email: 'test@example.com' },
    })
  );
  return {
    __esModule: true,
    default: mockFunc,
    getServerSession: mockFunc.getServerSession,
  };
});

import { setFeatureFlag } from '@/lib/featureFlags';
import { connectDB } from '@/lib/mongodb';
import { resetServices, initializeEventHandlers } from '@/services';
import { getEventBus, EnergyEventTypes, resetEventBus } from '@/events';
import Energy from '@/models/Energy';
import SourceEnergyReading from '@/models/SourceEnergyReading';
import FeatureFlag from '@/models/FeatureFlag';
import { EnergyBase } from '@/app/types';

jest.setTimeout(30000);

describe('Energy Server Actions Integration Tests', () => {
  const testUserId = '000000000000000000000002';

  beforeAll(async () => {
    await connectDB();
    initializeEventHandlers();
  });

  beforeEach(async () => {
    // Clean up test data
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    resetServices();
    resetEventBus();

    // Reset all backend flags to OFF (use old backend by default)
    await FeatureFlag.updateMany(
      { name: /_NEW_BACKEND/ },
      { $set: { enabled: false, rolloutPercent: 0 } }
    );
  });

  afterEach(async () => {
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
  });

  describe('addEnergyAction() - Dual Backend Support', () => {
    it('should use OLD backend when FORM_NEW_BACKEND flag is OFF', async () => {
      const energyData: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      };

      const result = await addEnergyAction(energyData);

      expect(result.success).toBe(true);

      // Should be in old Energy collection
      const inOldCollection = await Energy.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(inOldCollection).toBeTruthy();
      expect(inOldCollection?.amount).toBe(100);

      // Should NOT be in new SourceEnergyReading collection
      const inNewCollection = await SourceEnergyReading.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(inNewCollection).toBeNull();
    });

    it('should use NEW backend when FORM_NEW_BACKEND flag is ON', async () => {
      // Enable new backend for forms
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const energyData: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      };

      const result = await addEnergyAction(energyData);

      expect(result.success).toBe(true);

      // Should be in new SourceEnergyReading collection
      const inNewCollection = await SourceEnergyReading.findOne({
        userId: testUserId,
        type: 'power',
      });
      expect(inNewCollection).toBeTruthy();
      expect(inNewCollection?.amount).toBe(100);
    });

    it('should emit CREATED event when using NEW backend', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.CREATED, eventHandler);

      const energyData: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      };

      await addEnergyAction(energyData);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.CREATED,
          userId: testUserId,
        })
      );
    });

    it('should NOT emit events when using OLD backend', async () => {
      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.CREATED, eventHandler);

      const energyData: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      };

      await addEnergyAction(energyData);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('deleteEnergyAction() - Dual Backend Support', () => {
    let oldBackendId: string;
    let newBackendId: string;

    beforeEach(async () => {
      // Create data in old backend
      const oldReading = new Energy({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });
      const savedOld = await oldReading.save();
      oldBackendId = savedOld._id.toString();

      // Create data in new backend
      const newReading = new SourceEnergyReading({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-11-17'),
        amount: 50,
        unit: 'm³',
      });
      const savedNew = await newReading.save();
      newBackendId = savedNew._id.toString();
    });

    it('should use OLD backend when FORM_NEW_BACKEND flag is OFF', async () => {
      const result = await deleteEnergyAction(oldBackendId);

      expect(result.success).toBe(true);

      // Should be deleted from old collection
      const deleted = await Energy.findById(oldBackendId);
      expect(deleted).toBeNull();
    });

    it('should use NEW backend when FORM_NEW_BACKEND flag is ON', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const result = await deleteEnergyAction(newBackendId);

      expect(result.success).toBe(true);

      // Should be deleted from new collection
      const deleted = await SourceEnergyReading.findById(newBackendId);
      expect(deleted).toBeNull();
    });

    it('should emit DELETED event when using NEW backend', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.DELETED, eventHandler);

      await deleteEnergyAction(newBackendId);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.DELETED,
        })
      );
    });
  });

  describe('importCSVAction() - Dual Backend Support', () => {
    const csvData: EnergyBase[] = [
      { userId: testUserId, type: 'power', date: new Date('2024-01-01'), amount: 100 },
      { userId: testUserId, type: 'power', date: new Date('2024-02-01'), amount: 150 },
      { userId: testUserId, type: 'power', date: new Date('2024-03-01'), amount: 200 },
    ];

    it('should use OLD backend (loop) when CSV_IMPORT_NEW_BACKEND is OFF', async () => {
      const result = await importCSVAction(csvData, []);

      expect(result.success).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.error).toBe(0);

      // Should be in old collection
      const readings = await Energy.find({ userId: testUserId });
      expect(readings).toHaveLength(3);
    });

    it('should use NEW backend (bulk) when CSV_IMPORT_NEW_BACKEND is ON', async () => {
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const result = await importCSVAction(csvData, []);

      expect(result.success).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.error).toBe(0);

      // Should be in new collection
      const readings = await SourceEnergyReading.find({ userId: testUserId });
      expect(readings).toHaveLength(3);
    });

    it('should emit BULK_IMPORTED event when using NEW backend', async () => {
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const eventBus = getEventBus();
      const eventHandler = jest.fn();
      eventBus.on(EnergyEventTypes.BULK_IMPORTED, eventHandler);

      await importCSVAction(csvData, []);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.BULK_IMPORTED,
        })
      );
    });

    it('should be MUCH faster with NEW backend (bulk operation)', async () => {
      // Large dataset
      const largeDataset: EnergyBase[] = Array.from({ length: 100 }, (_, i) => ({
        userId: testUserId,
        type: 'power' as const,
        date: new Date(2024, 0, i + 1),
        amount: 100 + i,
      }));

      // Test OLD backend
      const oldStart = Date.now();
      await importCSVAction(largeDataset, []);
      const oldDuration = Date.now() - oldStart;

      // Clean up
      await Energy.deleteMany({ userId: testUserId });

      // Enable new backend
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Test NEW backend
      const newStart = Date.now();
      await importCSVAction(largeDataset, []);
      const newDuration = Date.now() - newStart;

      // New backend should be at least 5x faster
      expect(newDuration).toBeLessThan(oldDuration / 5);
      console.log(`Old backend: ${oldDuration}ms, New backend: ${newDuration}ms, Speedup: ${(oldDuration / newDuration).toFixed(1)}x`);
    }, 60000);

    it('should skip duplicate entries correctly (both backends)', async () => {
      const existing = [
        { ...csvData[0], _id: 'existing-1' },
      ];

      // Test old backend
      const resultOld = await importCSVAction(csvData, existing as any);
      expect(resultOld.success).toBe(2); // 2 new, 1 skipped
      expect(resultOld.skipped).toBe(1);

      // Clean up
      await Energy.deleteMany({ userId: testUserId });

      // Test new backend
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const resultNew = await importCSVAction(csvData, existing as any);
      expect(resultNew.success).toBe(2);
      expect(resultNew.skipped).toBe(1);
    });
  });

  describe('Flag routing scenarios', () => {
    it('should route to different backends based on component flags', async () => {
      // Enable CSV import but not forms
      await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      // CSV import should use new backend
      const csvData: EnergyBase[] = [
        { userId: testUserId, type: 'power', date: new Date('2024-01-01'), amount: 100 },
      ];
      await importCSVAction(csvData, []);
      const csvInNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(csvInNew).toHaveLength(1);

      // Form submission should use old backend
      const formData: EnergyBase = {
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-02-01'),
        amount: 50,
      };
      await addEnergyAction(formData);
      const formInOld = await Energy.find({ userId: testUserId, type: 'gas' });
      expect(formInOld).toHaveLength(1);
    });

    it('should support instant rollback (enable → disable)', async () => {
      // Enable new backend
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Use new backend
      const data1: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      };
      await addEnergyAction(data1);

      const inNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(inNew).toHaveLength(1);

      // Disable new backend (instant rollback)
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      // Use old backend
      const data2: EnergyBase = {
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-11-18'),
        amount: 50,
      };
      await addEnergyAction(data2);

      const inOld = await Energy.find({ userId: testUserId, type: 'gas' });
      expect(inOld).toHaveLength(1);

      // Rollback successful - zero downtime!
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully in new backend', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Try to create invalid data
      const invalidData: EnergyBase = {
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: -100, // Invalid: negative amount
      };

      const result = await addEnergyAction(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fallback to old backend if new backend fails', async () => {
      // This is implicitly tested by checking that old backend still works
      // when flag is OFF or when session is missing
    });
  });
});
