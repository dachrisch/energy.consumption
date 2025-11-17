/**
 * Service Layer Integration Tests
 *
 * Tests the complete flow:
 * 1. CRUD operation → Repository
 * 2. Event emission → EventBus
 * 3. Event handler → Display data invalidation
 *
 * Test scenarios:
 * - Create reading → Event → Invalidation
 * - Update reading → Event → Invalidation
 * - Delete reading → Event → Invalidation
 * - Bulk import → Event → Invalidation
 * - Error propagation through layers
 * - User isolation enforcement
 */

// Mock the aggregation services BEFORE imports
jest.mock('@/app/services/MonthlyDataAggregationService', () => ({
  calculateMonthlyReadings: jest.fn(),
}));

jest.mock('@/app/services/DataAggregationService', () => ({
  aggregateDataIntoBuckets: jest.fn(),
}));

import { EnergyCrudService } from '../energy/EnergyCrudService';
import { DisplayDataCalculationService } from '../display/DisplayDataCalculationService';
import { DisplayDataEventHandler } from '../handlers/DisplayDataEventHandler';
import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IDisplayDataRepository } from '@/repositories/interfaces/IDisplayDataRepository';
import { EventBus } from '@/events/EventBus';
import { EnergyEventTypes } from '@/events/types/EnergyEvents';
import { SourceEnergyReading } from '@/app/types';

// Mock repositories
class MockEnergyRepository implements IEnergyRepository {
  create = jest.fn();
  createMany = jest.fn();
  findById = jest.fn();
  findAll = jest.fn();
  findByDateRange = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  deleteMany = jest.fn();
  count = jest.fn();
  getMinMaxDates = jest.fn();
}

class MockDisplayDataRepository implements IDisplayDataRepository {
  upsert = jest.fn();
  findByType = jest.fn();
  findByTypeAndFilters = jest.fn();
  deleteByType = jest.fn();
  deleteAllForUser = jest.fn();
  invalidateForUser = jest.fn();
}

describe('Service Layer Integration Tests', () => {
  let energyCrudService: EnergyCrudService;
  let displayDataService: DisplayDataCalculationService;
  let eventHandler: DisplayDataEventHandler;
  let mockEnergyRepo: MockEnergyRepository;
  let mockDisplayRepo: MockDisplayDataRepository;
  let eventBus: EventBus;

  const userId = 'user-123';
  const now = new Date('2024-01-15T10:00:00Z');

  const createReading = (overrides?: Partial<SourceEnergyReading>): SourceEnergyReading => ({
    _id: 'reading-1',
    userId,
    type: 'power',
    amount: 1000,
    date: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(() => {
    // Setup repositories
    mockEnergyRepo = new MockEnergyRepository();
    mockDisplayRepo = new MockDisplayDataRepository();

    // Setup event bus
    eventBus = new EventBus();

    // Setup services
    energyCrudService = new EnergyCrudService(mockEnergyRepo, eventBus);
    displayDataService = new DisplayDataCalculationService(mockEnergyRepo, mockDisplayRepo);

    // Setup event handler (connects events to invalidation)
    eventHandler = new DisplayDataEventHandler(displayDataService, eventBus);

    // Default mock responses
    mockDisplayRepo.invalidateForUser.mockResolvedValue(undefined);

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup event handlers
    eventHandler.unregister();
  });

  describe('Create reading flow', () => {
    it('should complete full flow: create → emit event → invalidate display data', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const createdReading = createReading();

      mockEnergyRepo.create.mockResolvedValue(createdReading);

      // Perform create operation
      const result = await energyCrudService.create(newReading);

      // Verify repository was called
      expect(mockEnergyRepo.create).toHaveBeenCalledWith(newReading);
      expect(result).toEqual(createdReading);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was triggered
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should not invalidate if repository create fails', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };

      mockEnergyRepo.create.mockRejectedValue(new Error('Database error'));

      // Create should fail
      await expect(energyCrudService.create(newReading)).rejects.toThrow('Database error');

      // Wait for potential async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was NOT triggered
      expect(mockDisplayRepo.invalidateForUser).not.toHaveBeenCalled();
    });

    it('should isolate data by userId', async () => {
      const user1Reading = {
        userId: 'user-1',
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const user2Reading = {
        userId: 'user-2',
        type: 'gas' as const,
        amount: 500,
        date: now,
      };

      mockEnergyRepo.create
        .mockResolvedValueOnce(createReading({ ...user1Reading, _id: 'r1' }))
        .mockResolvedValueOnce(createReading({ ...user2Reading, _id: 'r2' }));

      // Create readings for different users
      await energyCrudService.create(user1Reading);
      await energyCrudService.create(user2Reading);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation for each user separately
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(2);
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenNthCalledWith(1, 'user-1');
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenNthCalledWith(2, 'user-2');
    });
  });

  describe('Update reading flow', () => {
    it('should complete full flow: update → emit event → invalidate display data', async () => {
      const readingId = 'reading-1';
      const beforeReading = createReading({ amount: 1000 });
      const afterReading = createReading({ amount: 1500 });

      mockEnergyRepo.findById.mockResolvedValue(beforeReading);
      mockEnergyRepo.update.mockResolvedValue(afterReading);

      // Perform update operation
      const result = await energyCrudService.update(readingId, userId, { amount: 1500 });

      // Verify repository was called
      expect(mockEnergyRepo.findById).toHaveBeenCalledWith(readingId, userId);
      expect(mockEnergyRepo.update).toHaveBeenCalledWith(readingId, userId, { amount: 1500 });
      expect(result).toEqual(afterReading);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was triggered
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should not invalidate if reading not found', async () => {
      const readingId = 'reading-1';

      mockEnergyRepo.findById.mockResolvedValue(null);

      // Update should return null
      const result = await energyCrudService.update(readingId, userId, { amount: 1500 });
      expect(result).toBeNull();

      // Wait for potential async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was NOT triggered
      expect(mockDisplayRepo.invalidateForUser).not.toHaveBeenCalled();
    });

    it('should not invalidate if update fails', async () => {
      const readingId = 'reading-1';
      const beforeReading = createReading({ amount: 1000 });

      mockEnergyRepo.findById.mockResolvedValue(beforeReading);
      mockEnergyRepo.update.mockResolvedValue(null);

      // Update should return null
      const result = await energyCrudService.update(readingId, userId, { amount: 1500 });
      expect(result).toBeNull();

      // Wait for potential async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was NOT triggered
      expect(mockDisplayRepo.invalidateForUser).not.toHaveBeenCalled();
    });
  });

  describe('Delete reading flow', () => {
    it('should complete full flow: delete → emit event → invalidate display data', async () => {
      const readingId = 'reading-1';
      const reading = createReading();

      mockEnergyRepo.findById.mockResolvedValue(reading);
      mockEnergyRepo.delete.mockResolvedValue(true);

      // Perform delete operation
      const result = await energyCrudService.delete(readingId, userId);

      // Verify repository was called
      expect(mockEnergyRepo.findById).toHaveBeenCalledWith(readingId, userId);
      expect(mockEnergyRepo.delete).toHaveBeenCalledWith(readingId, userId);
      expect(result).toBe(true);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was triggered
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should not invalidate if reading not found', async () => {
      const readingId = 'reading-1';

      mockEnergyRepo.findById.mockResolvedValue(null);

      // Delete should return false
      const result = await energyCrudService.delete(readingId, userId);
      expect(result).toBe(false);

      // Wait for potential async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was NOT triggered
      expect(mockDisplayRepo.invalidateForUser).not.toHaveBeenCalled();
    });
  });

  describe('Delete many readings flow', () => {
    it('should complete full flow: deleteMany → emit events → invalidate display data', async () => {
      const ids = ['r1', 'r2', 'r3'];
      const readings = [
        createReading({ _id: 'r1' }),
        createReading({ _id: 'r2' }),
        createReading({ _id: 'r3' }),
      ];

      mockEnergyRepo.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(readings[1])
        .mockResolvedValueOnce(readings[2]);
      mockEnergyRepo.deleteMany.mockResolvedValue(3);

      // Perform deleteMany operation
      const result = await energyCrudService.deleteMany(ids, userId);

      // Verify repository was called
      expect(mockEnergyRepo.deleteMany).toHaveBeenCalledWith(ids, userId);
      expect(result).toBe(3);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was triggered (once per deleted reading)
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(3);
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should only emit events for found readings', async () => {
      const ids = ['r1', 'r2', 'r3'];
      const readings = [createReading({ _id: 'r1' }), createReading({ _id: 'r3' })];

      // r2 not found
      mockEnergyRepo.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(readings[1]);
      mockEnergyRepo.deleteMany.mockResolvedValue(2);

      await energyCrudService.deleteMany(ids, userId);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should invalidate twice (for r1 and r3 only)
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('Bulk import flow', () => {
    it('should complete full flow: createMany → emit event → invalidate once', async () => {
      const newReadings = [
        { userId, type: 'power' as const, amount: 1000, date: now },
        { userId, type: 'gas' as const, amount: 500, date: now },
        { userId, type: 'power' as const, amount: 1100, date: now },
      ];
      const createdReadings = [
        createReading({ _id: 'r1', type: 'power' }),
        createReading({ _id: 'r2', type: 'gas', amount: 500 }),
        createReading({ _id: 'r3', type: 'power', amount: 1100 }),
      ];

      mockEnergyRepo.createMany.mockResolvedValue(createdReadings);

      // Perform bulk import
      const result = await energyCrudService.createMany(newReadings);

      // Verify repository was called
      expect(mockEnergyRepo.createMany).toHaveBeenCalledWith(newReadings);
      expect(result).toEqual(createdReadings);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify invalidation was triggered ONCE (not per reading)
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(1);
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should handle large bulk import efficiently', async () => {
      const newReadings = Array.from({ length: 1000 }, (_, i) => ({
        userId,
        type: 'power' as const,
        amount: 1000 + i,
        date: new Date(now.getTime() + i * 1000),
      }));
      const createdReadings = newReadings.map((r, i) =>
        createReading({ _id: `r${i}`, amount: r.amount, date: r.date })
      );

      mockEnergyRepo.createMany.mockResolvedValue(createdReadings);

      await energyCrudService.createMany(newReadings);

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should still invalidate only ONCE (performance optimization)
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event bus isolation', () => {
    it('should handle event errors without affecting other handlers', async () => {
      // Make invalidation fail
      mockDisplayRepo.invalidateForUser.mockRejectedValue(new Error('Invalidation failed'));

      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      mockEnergyRepo.create.mockResolvedValue(createReading());

      // Create should succeed (event error is isolated)
      const result = await energyCrudService.create(newReading);
      expect(result).toEqual(createReading());

      // Wait for async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Invalidation was attempted
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalled();
    });

    it('should verify event listeners are registered', () => {
      const listenerCount = {
        created: eventBus.listenerCount(EnergyEventTypes.CREATED),
        updated: eventBus.listenerCount(EnergyEventTypes.UPDATED),
        deleted: eventBus.listenerCount(EnergyEventTypes.DELETED),
        bulkImported: eventBus.listenerCount(EnergyEventTypes.BULK_IMPORTED),
      };

      expect(listenerCount.created).toBe(1);
      expect(listenerCount.updated).toBe(1);
      expect(listenerCount.deleted).toBe(1);
      expect(listenerCount.bulkImported).toBe(1);
    });

    it('should unregister event listeners on cleanup', () => {
      eventHandler.unregister();

      const listenerCount = {
        created: eventBus.listenerCount(EnergyEventTypes.CREATED),
        updated: eventBus.listenerCount(EnergyEventTypes.UPDATED),
        deleted: eventBus.listenerCount(EnergyEventTypes.DELETED),
        bulkImported: eventBus.listenerCount(EnergyEventTypes.BULK_IMPORTED),
      };

      expect(listenerCount.created).toBe(0);
      expect(listenerCount.updated).toBe(0);
      expect(listenerCount.deleted).toBe(0);
      expect(listenerCount.bulkImported).toBe(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle sequential operations correctly', async () => {
      // Create
      mockEnergyRepo.create.mockResolvedValue(createReading({ _id: 'r1' }));
      await energyCrudService.create({
        userId,
        type: 'power',
        amount: 1000,
        date: now,
      });

      // Update
      mockEnergyRepo.findById.mockResolvedValue(createReading({ _id: 'r1', amount: 1000 }));
      mockEnergyRepo.update.mockResolvedValue(createReading({ _id: 'r1', amount: 1500 }));
      await energyCrudService.update('r1', userId, { amount: 1500 });

      // Delete
      mockEnergyRepo.findById.mockResolvedValue(createReading({ _id: 'r1', amount: 1500 }));
      mockEnergyRepo.delete.mockResolvedValue(true);
      await energyCrudService.delete('r1', userId);

      // Wait for all async event handling
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should invalidate 3 times (once per operation)
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(3);
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledWith(userId);
    });

    it('should handle mixed operations for different users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1: Create
      mockEnergyRepo.create.mockResolvedValueOnce(
        createReading({ _id: 'r1', userId: user1 })
      );
      await energyCrudService.create({
        userId: user1,
        type: 'power',
        amount: 1000,
        date: now,
      });

      // User 2: Create
      mockEnergyRepo.create.mockResolvedValueOnce(
        createReading({ _id: 'r2', userId: user2 })
      );
      await energyCrudService.create({
        userId: user2,
        type: 'gas',
        amount: 500,
        date: now,
      });

      // User 1: Delete
      mockEnergyRepo.findById.mockResolvedValueOnce(
        createReading({ _id: 'r1', userId: user1 })
      );
      mockEnergyRepo.delete.mockResolvedValueOnce(true);
      await energyCrudService.delete('r1', user1);

      // Wait for all async event handling
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should invalidate 3 times total
      expect(mockDisplayRepo.invalidateForUser).toHaveBeenCalledTimes(3);

      // Check individual user invalidations
      const calls = mockDisplayRepo.invalidateForUser.mock.calls;
      expect(calls.filter((call) => call[0] === user1).length).toBe(2); // create + delete
      expect(calls.filter((call) => call[0] === user2).length).toBe(1); // create
    });
  });

  describe('Read-only operations', () => {
    it('should not invalidate on read operations', async () => {
      mockEnergyRepo.findById.mockResolvedValue(createReading());
      mockEnergyRepo.findAll.mockResolvedValue([createReading()]);
      mockEnergyRepo.findByDateRange.mockResolvedValue([createReading()]);
      mockEnergyRepo.count.mockResolvedValue(1);
      mockEnergyRepo.getMinMaxDates.mockResolvedValue({
        min: new Date('2024-01-01'),
        max: new Date('2024-12-31'),
      });

      // Perform read operations
      await energyCrudService.findById('reading-1', userId);
      await energyCrudService.findAll(userId);
      await energyCrudService.findByDateRange(
        userId,
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );
      await energyCrudService.count(userId);
      await energyCrudService.getMinMaxDates(userId);

      // Wait for potential async event handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should NOT invalidate
      expect(mockDisplayRepo.invalidateForUser).not.toHaveBeenCalled();
    });
  });
});
