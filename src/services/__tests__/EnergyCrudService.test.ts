/**
 * Tests for EnergyCrudService
 *
 * Test-first approach: Write tests before implementation
 * Coverage target: >95%
 *
 * Test scenarios:
 * - CRUD operations (create, update, delete, deleteMany)
 * - Event emission after successful operations
 * - Repository method delegation
 * - Error handling and propagation
 * - User isolation enforcement
 */

import { EnergyCrudService } from '../energy/EnergyCrudService';
import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IEventBus } from '@/events/interfaces/IEventBus';
import { EnergyEventTypes } from '@/events/types/EnergyEvents';
import { SourceEnergyReading, EnergyFilters } from '@/app/types';

// Mock repository
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

// Mock event bus
class MockEventBus implements IEventBus {
  emit = jest.fn();
  on = jest.fn();
  off = jest.fn();
  removeAllListeners = jest.fn();
  listenerCount = jest.fn();
}

describe('EnergyCrudService', () => {
  let service: EnergyCrudService;
  let mockRepository: MockEnergyRepository;
  let mockEventBus: MockEventBus;

  // Test data
  const userId = 'user-123';
  const readingId = 'reading-456';
  const now = new Date('2024-01-15T10:00:00Z');

  const createReading = (overrides?: Partial<SourceEnergyReading>): SourceEnergyReading => ({
    _id: readingId,
    userId,
    type: 'power',
    amount: 1000,
    date: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = new MockEnergyRepository();
    mockEventBus = new MockEventBus();
    service = new EnergyCrudService(mockRepository, mockEventBus);

    // Default: emit returns resolved promise
    mockEventBus.emit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create a new reading via repository', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const createdReading = createReading();

      mockRepository.create.mockResolvedValue(createdReading);

      const result = await service.create(newReading);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...newReading,
        unit: 'kWh',
      });
      expect(result).toEqual(createdReading);
    });

    it('should emit CREATED event after successful creation', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const createdReading = createReading();

      mockRepository.create.mockResolvedValue(createdReading);

      await service.create(newReading);

      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.CREATED,
          userId,
          data: createdReading,
        })
      );
    });

    it('should emit event with eventId and timestamp', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const createdReading = createReading();

      mockRepository.create.mockResolvedValue(createdReading);

      await service.create(newReading);

      const emittedEvent = mockEventBus.emit.mock.calls[0][0];
      expect(emittedEvent.eventId).toBeDefined();
      expect(emittedEvent.timestamp).toBeInstanceOf(Date);
    });

    it('should propagate repository errors', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      const error = new Error('Database error');

      mockRepository.create.mockRejectedValue(error);

      await expect(service.create(newReading)).rejects.toThrow('Database error');
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should not emit event if repository fails', async () => {
      const newReading = {
        userId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };

      mockRepository.create.mockRejectedValue(new Error('Failed'));

      await expect(service.create(newReading)).rejects.toThrow();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('createMany()', () => {
    it('should create multiple readings via repository', async () => {
      const newReadings = [
        { userId, type: 'power' as const, amount: 1000, date: now },
        { userId, type: 'gas' as const, amount: 500, date: now },
      ];
      const createdReadings = [
        createReading({ _id: 'r1', type: 'power' }),
        createReading({ _id: 'r2', type: 'gas', amount: 500 }),
      ];

      mockRepository.createMany.mockResolvedValue(createdReadings);

      const result = await service.createMany(newReadings);

      expect(mockRepository.createMany).toHaveBeenCalledWith([
        { ...newReadings[0], unit: 'kWh' },
        { ...newReadings[1], unit: 'm³' },
      ]);
      expect(result).toEqual(createdReadings);
    });

    it('should emit BULK_IMPORTED event after successful creation', async () => {
      const newReadings = [
        { userId, type: 'power' as const, amount: 1000, date: now },
        { userId, type: 'gas' as const, amount: 500, date: now },
      ];
      const createdReadings = [
        createReading({ _id: 'r1', type: 'power' }),
        createReading({ _id: 'r2', type: 'gas', amount: 500 }),
      ];

      mockRepository.createMany.mockResolvedValue(createdReadings);

      await service.createMany(newReadings);

      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.BULK_IMPORTED,
          userId,
          data: {
            readings: createdReadings,
            count: 2,
          },
        })
      );
    });

    it('should NOT emit individual CREATED events for bulk import', async () => {
      const newReadings = [
        { userId, type: 'power' as const, amount: 1000, date: now },
        { userId, type: 'gas' as const, amount: 500, date: now },
      ];
      const createdReadings = [
        createReading({ _id: 'r1' }),
        createReading({ _id: 'r2' }),
      ];

      mockRepository.createMany.mockResolvedValue(createdReadings);

      await service.createMany(newReadings);

      // Should emit exactly once (BULK_IMPORTED only)
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.BULK_IMPORTED,
        })
      );
    });

    it('should handle empty array', async () => {
      mockRepository.createMany.mockResolvedValue([]);

      const result = await service.createMany([]);

      expect(result).toEqual([]);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { readings: [], count: 0 },
        })
      );
    });

    it('should propagate repository errors', async () => {
      const newReadings = [
        { userId, type: 'power' as const, amount: 1000, date: now },
      ];

      mockRepository.createMany.mockRejectedValue(new Error('Bulk insert failed'));

      await expect(service.createMany(newReadings)).rejects.toThrow('Bulk insert failed');
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should fetch reading before update', async () => {
      const beforeReading = createReading({ amount: 1000 });
      const afterReading = createReading({ amount: 1500 });

      mockRepository.findById.mockResolvedValue(beforeReading);
      mockRepository.update.mockResolvedValue(afterReading);

      await service.update(readingId, userId, { amount: 1500 });

      expect(mockRepository.findById).toHaveBeenCalledWith(readingId, userId);
    });

    it('should update reading via repository', async () => {
      const beforeReading = createReading({ amount: 1000 });
      const afterReading = createReading({ amount: 1500 });
      const updateData = { amount: 1500 };

      mockRepository.findById.mockResolvedValue(beforeReading);
      mockRepository.update.mockResolvedValue(afterReading);

      const result = await service.update(readingId, userId, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(readingId, userId, updateData);
      expect(result).toEqual(afterReading);
    });

    it('should emit UPDATED event with before and after data', async () => {
      const beforeReading = createReading({ amount: 1000 });
      const afterReading = createReading({ amount: 1500 });

      mockRepository.findById.mockResolvedValue(beforeReading);
      mockRepository.update.mockResolvedValue(afterReading);

      await service.update(readingId, userId, { amount: 1500 });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.UPDATED,
          userId,
          data: {
            before: beforeReading,
            after: afterReading,
          },
        })
      );
    });

    it('should return null if reading not found before update', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.update(readingId, userId, { amount: 1500 });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should return null if update fails', async () => {
      const beforeReading = createReading({ amount: 1000 });

      mockRepository.findById.mockResolvedValue(beforeReading);
      mockRepository.update.mockResolvedValue(null);

      const result = await service.update(readingId, userId, { amount: 1500 });

      expect(result).toBeNull();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Find failed'));

      await expect(service.update(readingId, userId, { amount: 1500 })).rejects.toThrow(
        'Find failed'
      );
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should fetch reading before delete', async () => {
      const reading = createReading();

      mockRepository.findById.mockResolvedValue(reading);
      mockRepository.delete.mockResolvedValue(true);

      await service.delete(readingId, userId);

      expect(mockRepository.findById).toHaveBeenCalledWith(readingId, userId);
    });

    it('should delete reading via repository', async () => {
      const reading = createReading();

      mockRepository.findById.mockResolvedValue(reading);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.delete(readingId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(readingId, userId);
      expect(result).toBe(true);
    });

    it('should emit DELETED event with reading data', async () => {
      const reading = createReading();

      mockRepository.findById.mockResolvedValue(reading);
      mockRepository.delete.mockResolvedValue(true);

      await service.delete(readingId, userId);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EnergyEventTypes.DELETED,
          userId,
          data: {
            id: readingId,
            reading,
          },
        })
      );
    });

    it('should return false if reading not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.delete(readingId, userId);

      expect(result).toBe(false);
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should return false if delete operation fails', async () => {
      const reading = createReading();

      mockRepository.findById.mockResolvedValue(reading);
      mockRepository.delete.mockResolvedValue(false);

      const result = await service.delete(readingId, userId);

      expect(result).toBe(false);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Find failed'));

      await expect(service.delete(readingId, userId)).rejects.toThrow('Find failed');
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('deleteMany()', () => {
    it('should fetch all readings before delete', async () => {
      const ids = ['r1', 'r2', 'r3'];
      const readings = [
        createReading({ _id: 'r1' }),
        createReading({ _id: 'r2' }),
        createReading({ _id: 'r3' }),
      ];

      mockRepository.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(readings[1])
        .mockResolvedValueOnce(readings[2]);
      mockRepository.deleteMany.mockResolvedValue(3);

      await service.deleteMany(ids, userId);

      expect(mockRepository.findById).toHaveBeenCalledTimes(3);
      expect(mockRepository.findById).toHaveBeenCalledWith('r1', userId);
      expect(mockRepository.findById).toHaveBeenCalledWith('r2', userId);
      expect(mockRepository.findById).toHaveBeenCalledWith('r3', userId);
    });

    it('should delete multiple readings via repository', async () => {
      const ids = ['r1', 'r2'];
      const readings = [createReading({ _id: 'r1' }), createReading({ _id: 'r2' })];

      mockRepository.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(readings[1]);
      mockRepository.deleteMany.mockResolvedValue(2);

      const result = await service.deleteMany(ids, userId);

      expect(mockRepository.deleteMany).toHaveBeenCalledWith(ids, userId);
      expect(result).toBe(2);
    });

    it('should emit individual DELETED events for each reading', async () => {
      const ids = ['r1', 'r2'];
      const readings = [createReading({ _id: 'r1' }), createReading({ _id: 'r2' })];

      mockRepository.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(readings[1]);
      mockRepository.deleteMany.mockResolvedValue(2);

      await service.deleteMany(ids, userId);

      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
      expect(mockEventBus.emit).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          eventType: EnergyEventTypes.DELETED,
          data: { id: 'r1', reading: readings[0] },
        })
      );
      expect(mockEventBus.emit).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          eventType: EnergyEventTypes.DELETED,
          data: { id: 'r2', reading: readings[1] },
        })
      );
    });

    it('should only emit events for readings that were found', async () => {
      const ids = ['r1', 'r2', 'r3'];
      const readings = [createReading({ _id: 'r1' }), createReading({ _id: 'r3' })];

      // r2 not found
      mockRepository.findById
        .mockResolvedValueOnce(readings[0])
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(readings[1]);
      mockRepository.deleteMany.mockResolvedValue(2);

      await service.deleteMany(ids, userId);

      // Should only emit 2 events (for r1 and r3)
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle empty array', async () => {
      mockRepository.deleteMany.mockResolvedValue(0);

      const result = await service.deleteMany([], userId);

      expect(result).toBe(0);
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const ids = ['r1'];

      mockRepository.findById.mockRejectedValue(new Error('Find failed'));

      await expect(service.deleteMany(ids, userId)).rejects.toThrow('Find failed');
    });
  });

  describe('Read-only methods (no events)', () => {
    describe('findById()', () => {
      it('should delegate to repository', async () => {
        const reading = createReading();
        mockRepository.findById.mockResolvedValue(reading);

        const result = await service.findById(readingId, userId);

        expect(mockRepository.findById).toHaveBeenCalledWith(readingId, userId);
        expect(result).toEqual(reading);
      });

      it('should not emit any events', async () => {
        const reading = createReading();
        mockRepository.findById.mockResolvedValue(reading);

        await service.findById(readingId, userId);

        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });

      it('should return null if not found', async () => {
        mockRepository.findById.mockResolvedValue(null);

        const result = await service.findById(readingId, userId);

        expect(result).toBeNull();
      });
    });

    describe('findAll()', () => {
      it('should delegate to repository', async () => {
        const readings = [createReading(), createReading({ _id: 'r2' })];
        const filters: EnergyFilters = { type: 'power', limit: 10 };
        mockRepository.findAll.mockResolvedValue(readings);

        const result = await service.findAll(userId, filters);

        expect(mockRepository.findAll).toHaveBeenCalledWith(userId, filters);
        expect(result).toEqual(readings);
      });

      it('should not emit any events', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        await service.findAll(userId);

        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });
    });

    describe('findByDateRange()', () => {
      it('should delegate to repository', async () => {
        const readings = [createReading()];
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        mockRepository.findByDateRange.mockResolvedValue(readings);

        const result = await service.findByDateRange(userId, startDate, endDate, 'power');

        expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
          userId,
          startDate,
          endDate,
          'power'
        );
        expect(result).toEqual(readings);
      });

      it('should not emit any events', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        mockRepository.findByDateRange.mockResolvedValue([]);

        await service.findByDateRange(userId, startDate, endDate);

        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });
    });

    describe('count()', () => {
      it('should delegate to repository', async () => {
        const filters: EnergyFilters = { type: 'power' };
        mockRepository.count.mockResolvedValue(42);

        const result = await service.count(userId, filters);

        expect(mockRepository.count).toHaveBeenCalledWith(userId, filters);
        expect(result).toBe(42);
      });

      it('should not emit any events', async () => {
        mockRepository.count.mockResolvedValue(0);

        await service.count(userId);

        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });
    });

    describe('getMinMaxDates()', () => {
      it('should delegate to repository', async () => {
        const result = { min: new Date('2024-01-01'), max: new Date('2024-12-31') };
        mockRepository.getMinMaxDates.mockResolvedValue(result);

        const dates = await service.getMinMaxDates(userId, 'power');

        expect(mockRepository.getMinMaxDates).toHaveBeenCalledWith(userId, 'power');
        expect(dates).toEqual(result);
      });

      it('should not emit any events', async () => {
        mockRepository.getMinMaxDates.mockResolvedValue(null);

        await service.getMinMaxDates(userId);

        expect(mockEventBus.emit).not.toHaveBeenCalled();
      });
    });
  });

  describe('User isolation', () => {
    it('should always pass userId to repository methods', async () => {
      const newReading = { userId, type: 'power' as const, amount: 1000, date: now };
      mockRepository.create.mockResolvedValue(createReading());

      await service.create(newReading);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId })
      );
    });

    it('should use userId from reading in events', async () => {
      const differentUserId = 'user-999';
      const newReading = {
        userId: differentUserId,
        type: 'power' as const,
        amount: 1000,
        date: now,
      };
      mockRepository.create.mockResolvedValue(
        createReading({ userId: differentUserId })
      );

      await service.create(newReading);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ userId: differentUserId })
      );
    });
  });
});
