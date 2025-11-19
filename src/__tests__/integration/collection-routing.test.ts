/**
 * Collection Routing Tests
 *
 * Verifies that data is written to the correct MongoDB collections
 * based on feature flag state:
 * - Flag OFF → Energy collection (old backend)
 * - Flag ON → SourceEnergyReading collection (new backend)
 *
 * This is critical to ensure the adapter layer routes correctly.
 */

// Mock NextAuth BEFORE any imports
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
  getServerSession: jest.fn(() =>
    Promise.resolve({
      user: { id: 'test-collection-routing', email: 'routing@example.com' },
    })
  ),
}));

import { connectDB } from '@/lib/mongodb';
import { setFeatureFlag } from '@/lib/featureFlags';
import { addEnergyAction, deleteEnergyAction, importCSVAction } from '@/actions/energy';
import { getEnergyCrudService, getDisplayDataService, resetServices, initializeEventHandlers } from '@/services';
import Energy from '@/models/Energy';
import SourceEnergyReading from '@/models/SourceEnergyReading';
import DisplayEnergyData from '@/models/DisplayEnergyData';
import FeatureFlag from '@/models/FeatureFlag';
import { EnergyBase } from '@/app/types';

jest.setTimeout(30000);

describe('Collection Routing Tests - New Data to New Collections', () => {
  const testUserId = 'test-collection-routing';

  beforeAll(async () => {
    await connectDB();
    initializeEventHandlers();
  });

  beforeEach(async () => {
    // Clean slate - delete from BOTH collections
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });

    // Reset all flags to OFF
    await FeatureFlag.updateMany(
      { name: /_NEW_BACKEND/ },
      { $set: { enabled: false, rolloutPercent: 0, userWhitelist: [], userBlacklist: [] } }
    );

    resetServices();
  });

  afterEach(async () => {
    await Energy.deleteMany({ userId: testUserId });
    await SourceEnergyReading.deleteMany({ userId: testUserId });
    await DisplayEnergyData.deleteMany({ userId: testUserId });
  });

  describe('Server Actions - Collection Routing', () => {
    describe('addEnergyAction()', () => {
      it('should write to OLD Energy collection when FORM_NEW_BACKEND is OFF', async () => {
        // Verify flag is OFF
        const flag = await FeatureFlag.findOne({ name: 'FORM_NEW_BACKEND' });
        expect(flag?.enabled).toBeFalsy();

        // Add energy reading
        const result = await addEnergyAction({
          userId: testUserId,
          type: 'power',
          date: new Date('2024-11-17'),
          amount: 12345.67,
        });

        expect(result.success).toBe(true);

        // Verify data is in OLD collection
        const inOldCollection = await Energy.findOne({
          userId: testUserId,
          type: 'power',
        });

        expect(inOldCollection).toBeTruthy();
        expect(inOldCollection?.amount).toBe(12345.67);
        expect(inOldCollection?.userId).toBe(testUserId);

        // Verify data is NOT in NEW collection
        const inNewCollection = await SourceEnergyReading.findOne({
          userId: testUserId,
          type: 'power',
        });

        expect(inNewCollection).toBeNull();

        console.log('✅ Flag OFF: Data correctly written to Energy collection');
      });

      it('should write to NEW SourceEnergyReading collection when FORM_NEW_BACKEND is ON', async () => {
        // Enable new backend flag
        await setFeatureFlag('FORM_NEW_BACKEND', {
          enabled: true,
          rolloutPercent: 100,
        });

        // Verify flag is ON
        const flag = await FeatureFlag.findOne({ name: 'FORM_NEW_BACKEND' });
        expect(flag?.enabled).toBe(true);

        // Add energy reading
        const result = await addEnergyAction({
          userId: testUserId,
          type: 'power',
          date: new Date('2024-11-17'),
          amount: 12345.67,
        });

        expect(result.success).toBe(true);

        // Verify data is in NEW collection
        const inNewCollection = await SourceEnergyReading.findOne({
          userId: testUserId,
          type: 'power',
        });

        expect(inNewCollection).toBeTruthy();
        expect(inNewCollection?.amount).toBe(12345.67);
        expect(inNewCollection?.userId).toBe(testUserId);
        expect(inNewCollection?._id).toBeDefined();

        // Verify data is NOT in OLD collection
        const inOldCollection = await Energy.findOne({
          userId: testUserId,
          type: 'power',
        });

        expect(inOldCollection).toBeNull();

        console.log('✅ Flag ON: Data correctly written to SourceEnergyReading collection');
      });

      it('should handle multiple readings with flag ON - all to new collection', async () => {
        await setFeatureFlag('FORM_NEW_BACKEND', {
          enabled: true,
          rolloutPercent: 100,
        });

        // Add multiple readings
        await addEnergyAction({
          userId: testUserId,
          type: 'power',
          date: new Date('2024-01-01'),
          amount: 100,
        });

        await addEnergyAction({
          userId: testUserId,
          type: 'gas',
          date: new Date('2024-02-01'),
          amount: 50,
        });

        await addEnergyAction({
          userId: testUserId,
          type: 'power',
          date: new Date('2024-03-01'),
          amount: 150,
        });

        // All should be in new collection
        const allNewReadings = await SourceEnergyReading.find({ userId: testUserId });
        expect(allNewReadings).toHaveLength(3);

        const powerReadings = allNewReadings.filter(r => r.type === 'power');
        const gasReadings = allNewReadings.filter(r => r.type === 'gas');
        expect(powerReadings).toHaveLength(2);
        expect(gasReadings).toHaveLength(1);

        // None should be in old collection
        const oldReadings = await Energy.find({ userId: testUserId });
        expect(oldReadings).toHaveLength(0);

        console.log('✅ Multiple readings: All correctly routed to new collection');
      });
    });

    describe('importCSVAction()', () => {
      it('should write to OLD collection when CSV_IMPORT_NEW_BACKEND is OFF', async () => {
        const csvData: EnergyBase[] = [
          { userId: testUserId, type: 'power', date: new Date('2024-01-01'), amount: 100 },
          { userId: testUserId, type: 'power', date: new Date('2024-02-01'), amount: 150 },
          { userId: testUserId, type: 'power', date: new Date('2024-03-01'), amount: 200 },
        ];

        const result = await importCSVAction(csvData, []);

        expect(result.success).toBe(3);

        // All in old collection
        const inOld = await Energy.find({ userId: testUserId });
        expect(inOld).toHaveLength(3);

        // None in new collection
        const inNew = await SourceEnergyReading.find({ userId: testUserId });
        expect(inNew).toHaveLength(0);

        console.log('✅ CSV Import (flag OFF): Data written to Energy collection');
      });

      it('should write to NEW collection when CSV_IMPORT_NEW_BACKEND is ON', async () => {
        await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
          enabled: true,
          rolloutPercent: 100,
        });

        const csvData: EnergyBase[] = [
          { userId: testUserId, type: 'gas', date: new Date('2024-01-01'), amount: 50 },
          { userId: testUserId, type: 'gas', date: new Date('2024-02-01'), amount: 60 },
          { userId: testUserId, type: 'gas', date: new Date('2024-03-01'), amount: 70 },
        ];

        const result = await importCSVAction(csvData, []);

        expect(result.success).toBe(3);

        // All in new collection
        const inNew = await SourceEnergyReading.find({ userId: testUserId });
        expect(inNew).toHaveLength(3);
        expect(inNew.every(r => r.type === 'gas')).toBe(true);

        // None in old collection
        const inOld = await Energy.find({ userId: testUserId });
        expect(inOld).toHaveLength(0);

        console.log('✅ CSV Import (flag ON): Data written to SourceEnergyReading collection');
      });

      it('should handle large CSV import to new collection (bulk operation)', async () => {
        await setFeatureFlag('CSV_IMPORT_NEW_BACKEND', {
          enabled: true,
          rolloutPercent: 100,
        });

        // Large dataset
        const csvData: EnergyBase[] = Array.from({ length: 100 }, (_, i) => ({
          userId: testUserId,
          type: 'power' as const,
          date: new Date(2024, 0, i + 1),
          amount: 1000 + i,
        }));

        const result = await importCSVAction(csvData, []);

        expect(result.success).toBe(100);
        expect(result.error).toBe(0);

        // All 100 in new collection
        const inNew = await SourceEnergyReading.find({ userId: testUserId });
        expect(inNew).toHaveLength(100);

        // Verify all have correct data
        expect(inNew.every(r => r.userId === testUserId)).toBe(true);
        expect(inNew.every(r => r.type === 'power')).toBe(true);

        // None in old collection
        const inOld = await Energy.find({ userId: testUserId });
        expect(inOld).toHaveLength(0);

        console.log('✅ Large CSV Import: 100 records correctly in new collection');
      });
    });
  });

  describe('Service Layer - Direct Collection Verification', () => {
    it('should write to SourceEnergyReading via service.create()', async () => {
      const service = getEnergyCrudService();

      const created = await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 999.99,
      });

      expect(created._id).toBeDefined();
      expect(created.userId).toBe(testUserId);

      // Verify in new collection
      const inNew = await SourceEnergyReading.findById(created._id);
      expect(inNew).toBeTruthy();
      expect(inNew?.amount).toBe(999.99);

      console.log('✅ Service Layer: Data written to SourceEnergyReading');
    });

    it('should write to SourceEnergyReading via service.createMany()', async () => {
      const service = getEnergyCrudService();

      const readings = [
        { userId: testUserId, type: 'gas' as const, date: new Date('2024-01-01'), amount: 10 },
        { userId: testUserId, type: 'gas' as const, date: new Date('2024-02-01'), amount: 20 },
        { userId: testUserId, type: 'gas' as const, date: new Date('2024-03-01'), amount: 30 },
      ];

      const created = await service.createMany(readings);

      expect(created).toHaveLength(3);
      expect(created.every(r => r._id !== undefined)).toBe(true);

      // Verify all in new collection
      const inNew = await SourceEnergyReading.find({ userId: testUserId });
      expect(inNew).toHaveLength(3);
      expect(inNew.map(r => r.amount).sort((a, b) => a - b)).toEqual([10, 20, 30]);

      console.log('✅ Service Layer Bulk: 3 records in SourceEnergyReading');
    });
  });

  describe('Display Data Collection', () => {
    it('should create DisplayEnergyData when calculating monthly chart', async () => {
      // First, create source data
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'power', date: new Date('2024-01-15'), amount: 10000 },
        { userId: testUserId, type: 'power', date: new Date('2024-02-15'), amount: 10150 },
        { userId: testUserId, type: 'power', date: new Date('2024-03-15'), amount: 10300 },
      ]);

      // Verify source data in collection
      const sourceReadings = await SourceEnergyReading.find({ userId: testUserId });
      expect(sourceReadings).toHaveLength(3);

      // Calculate display data
      const displayService = getDisplayDataService();
      const monthlyData = await displayService.calculateMonthlyChartData(
        testUserId,
        'power',
        2024
      );

      expect(monthlyData.months).toHaveLength(12);

      // Verify display data written to DisplayEnergyData collection
      const displayData = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'power',
        displayType: 'monthly-chart-power',
        year: 2024,
      });

      expect(displayData).toBeTruthy();
      expect(displayData?.userId).toBe(testUserId);
      expect(displayData?.type).toBe('power');
      expect(displayData?.year).toBe(2024);
      expect(displayData?.data).toBeDefined();
      expect(displayData?.sourceDataHash).toBeDefined();
      expect(displayData?.calculatedAt).toBeDefined();

      console.log('✅ Display Data: Monthly chart written to DisplayEnergyData collection');
    });

    it('should create histogram data in DisplayEnergyData collection', async () => {
      // Create source data
      const service = getEnergyCrudService();
      await service.createMany([
        { userId: testUserId, type: 'gas', date: new Date('2024-01-01'), amount: 500 },
        { userId: testUserId, type: 'gas', date: new Date('2024-06-01'), amount: 550 },
        { userId: testUserId, type: 'gas', date: new Date('2024-12-01'), amount: 600 },
      ]);

      // Calculate histogram
      const displayService = getDisplayDataService();
      const histogramData = await displayService.calculateHistogramData(
        testUserId,
        'gas',
        50
      );

      expect(histogramData.buckets).toBeDefined();

      // Verify in collection
      const displayData = await DisplayEnergyData.findOne({
        userId: testUserId,
        type: 'gas',
        displayType: 'histogram-gas',
      });

      expect(displayData).toBeTruthy();
      expect(displayData?.type).toBe('gas');
      expect(displayData?.data).toBeDefined();

      console.log('✅ Display Data: Histogram written to DisplayEnergyData collection');
    });
  });

  describe('Collection Isolation', () => {
    it('should keep old and new collections completely separate', async () => {
      // Create data in OLD collection (flag OFF)
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-01'),
        amount: 111,
      });

      // Enable new backend
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      // Create data in NEW collection (flag ON)
      await addEnergyAction({
        userId: testUserId,
        type: 'gas',
        date: new Date('2024-02-01'),
        amount: 222,
      });

      // Verify OLD collection has only old data
      const oldData = await Energy.find({ userId: testUserId });
      expect(oldData).toHaveLength(1);
      expect(oldData[0].type).toBe('power');
      expect(oldData[0].amount).toBe(111);

      // Verify NEW collection has only new data
      const newData = await SourceEnergyReading.find({ userId: testUserId });
      expect(newData).toHaveLength(1);
      expect(newData[0].type).toBe('gas');
      expect(newData[0].amount).toBe(222);

      // Collections are isolated
      console.log('✅ Collection Isolation: Old and new data kept separate');
    });

    it('should handle switching between collections without data loss', async () => {
      // Phase 1: Use old collection
      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-01-01'),
        amount: 100,
      });

      const oldCount1 = await Energy.countDocuments({ userId: testUserId });
      expect(oldCount1).toBe(1);

      // Phase 2: Switch to new collection
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-02-01'),
        amount: 200,
      });

      const newCount1 = await SourceEnergyReading.countDocuments({ userId: testUserId });
      expect(newCount1).toBe(1);

      // Phase 3: Switch back to old collection
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: false,
        rolloutPercent: 0,
      });

      await addEnergyAction({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-03-01'),
        amount: 300,
      });

      // Verify no data lost
      const oldCountFinal = await Energy.countDocuments({ userId: testUserId });
      expect(oldCountFinal).toBe(2); // Original + new after switch back

      const newCountFinal = await SourceEnergyReading.countDocuments({ userId: testUserId });
      expect(newCountFinal).toBe(1); // Still has the one created

      console.log('✅ No Data Loss: All data preserved across collection switches');
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data integrity in new collection', async () => {
      await setFeatureFlag('FORM_NEW_BACKEND', {
        enabled: true,
        rolloutPercent: 100,
      });

      const testData = {
        userId: testUserId,
        type: 'power' as const,
        date: new Date('2024-11-17T10:30:00Z'),
        amount: 12345.6789,
      };

      await addEnergyAction(testData);

      const saved = await SourceEnergyReading.findOne({
        userId: testUserId,
        type: 'power',
      });

      expect(saved).toBeTruthy();
      expect(saved?.userId).toBe(testData.userId);
      expect(saved?.type).toBe(testData.type);
      expect(saved?.amount).toBe(testData.amount);
      expect(saved?.date.toISOString()).toBe(testData.date.toISOString());
      expect(saved?.createdAt).toBeDefined();
      expect(saved?.updatedAt).toBeDefined();

      console.log('✅ Data Integrity: All fields correctly saved');
    });

    it('should enforce unique constraints in new collection', async () => {
      const service = getEnergyCrudService();

      // Create first reading
      await service.create({
        userId: testUserId,
        type: 'power',
        date: new Date('2024-11-17'),
        amount: 100,
      });

      // Try to create duplicate (same userId, type, date)
      await expect(
        service.create({
          userId: testUserId,
          type: 'power',
          date: new Date('2024-11-17'),
          amount: 200,
        })
      ).rejects.toThrow();

      // Verify only one record exists
      const count = await SourceEnergyReading.countDocuments({
        userId: testUserId,
        type: 'power',
      });
      expect(count).toBe(1);

      console.log('✅ Unique Constraints: Enforced in new collection');
    });
  });
});
