/**
 * Tests for DisplayDataEventHandler
 *
 * Test-first approach: Write tests before implementation
 * Coverage target: >95%
 *
 * Test scenarios:
 * - Event handler registration
 * - Invalidation on CREATED events
 * - Invalidation on UPDATED events
 * - Invalidation on DELETED events
 * - Invalidation on BULK_IMPORTED events
 * - Handler cleanup/unregistration
 */

import { DisplayDataEventHandler } from '../handlers/DisplayDataEventHandler';
import { IEventBus } from '@/events/interfaces/IEventBus';
import { EnergyEventTypes } from '@/events/types/EnergyEvents';
import {
  EnergyReadingCreatedEvent,
  EnergyReadingUpdatedEvent,
  EnergyReadingDeletedEvent,
  EnergyReadingsBulkImportedEvent,
} from '@/events/types/EnergyEvents';
import { SourceEnergyReading } from '@/app/types';

// Mock services
class MockDisplayDataCalculationService {
  invalidateAllForUser = jest.fn();
  calculateMonthlyChartData = jest.fn();
  calculateHistogramData = jest.fn();
}

class MockEventBus implements IEventBus {
  emit = jest.fn();
  on = jest.fn();
  off = jest.fn();
  removeAllListeners = jest.fn();
  listenerCount = jest.fn();
}

describe('DisplayDataEventHandler', () => {
  let handler: DisplayDataEventHandler;
  let mockDisplayService: MockDisplayDataCalculationService;
  let mockEventBus: MockEventBus;

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
    mockDisplayService = new MockDisplayDataCalculationService();
    mockEventBus = new MockEventBus();

    // Default: invalidation succeeds
    mockDisplayService.invalidateAllForUser.mockResolvedValue(undefined);

    // Create handler (should register event handlers in constructor)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler = new DisplayDataEventHandler(mockDisplayService as any, mockEventBus as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and registration', () => {
    it('should register handlers for all energy event types', () => {
      expect(mockEventBus.on).toHaveBeenCalledTimes(4);
      expect(mockEventBus.on).toHaveBeenCalledWith(
        EnergyEventTypes.CREATED,
        expect.any(Function)
      );
      expect(mockEventBus.on).toHaveBeenCalledWith(
        EnergyEventTypes.UPDATED,
        expect.any(Function)
      );
      expect(mockEventBus.on).toHaveBeenCalledWith(
        EnergyEventTypes.DELETED,
        expect.any(Function)
      );
      expect(mockEventBus.on).toHaveBeenCalledWith(
        EnergyEventTypes.BULK_IMPORTED,
        expect.any(Function)
      );
    });
  });

  describe('CREATED event handling', () => {
    it('should invalidate display data when reading is created', async () => {
      const event: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId,
        data: createReading(),
      };

      // Get the registered handler for CREATED events
      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      expect(createdHandler).toBeDefined();

      // Call the handler
      await createdHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple CREATED events', async () => {
      const event1: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId: 'user-1',
        data: createReading({ userId: 'user-1' }),
      };

      const event2: EnergyReadingCreatedEvent = {
        eventId: 'event-2',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId: 'user-2',
        data: createReading({ userId: 'user-2' }),
      };

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      await createdHandler!(event1);
      await createdHandler!(event2);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(2);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenNthCalledWith(1, 'user-1');
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenNthCalledWith(2, 'user-2');
    });

    it('should handle invalidation errors gracefully', async () => {
      const event: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId,
        data: createReading(),
      };

      mockDisplayService.invalidateAllForUser.mockRejectedValue(
        new Error('Invalidation failed')
      );

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      // Should propagate error (event bus handles error isolation)
      await expect(createdHandler!(event)).rejects.toThrow('Invalidation failed');
    });
  });

  describe('UPDATED event handling', () => {
    it('should invalidate display data when reading is updated', async () => {
      const beforeReading = createReading({ amount: 1000 });
      const afterReading = createReading({ amount: 1500 });

      const event: EnergyReadingUpdatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.UPDATED,
        timestamp: now,
        userId,
        data: { before: beforeReading, after: afterReading },
      };

      const updatedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.UPDATED
      )?.[1];

      expect(updatedHandler).toBeDefined();

      await updatedHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should use userId from event', async () => {
      const differentUserId = 'user-999';
      const event: EnergyReadingUpdatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.UPDATED,
        timestamp: now,
        userId: differentUserId,
        data: {
          before: createReading({ userId: differentUserId }),
          after: createReading({ userId: differentUserId, amount: 1500 }),
        },
      };

      const updatedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.UPDATED
      )?.[1];

      await updatedHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(differentUserId);
    });
  });

  describe('DELETED event handling', () => {
    it('should invalidate display data when reading is deleted', async () => {
      const event: EnergyReadingDeletedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.DELETED,
        timestamp: now,
        userId,
        data: {
          id: 'reading-1',
          reading: createReading(),
        },
      };

      const deletedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.DELETED
      )?.[1];

      expect(deletedHandler).toBeDefined();

      await deletedHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple DELETED events', async () => {
      const event1: EnergyReadingDeletedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.DELETED,
        timestamp: now,
        userId: 'user-1',
        data: { id: 'r1', reading: createReading({ userId: 'user-1' }) },
      };

      const event2: EnergyReadingDeletedEvent = {
        eventId: 'event-2',
        eventType: EnergyEventTypes.DELETED,
        timestamp: now,
        userId: 'user-1',
        data: { id: 'r2', reading: createReading({ userId: 'user-1' }) },
      };

      const deletedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.DELETED
      )?.[1];

      await deletedHandler!(event1);
      await deletedHandler!(event2);

      // Should invalidate twice (once per delete event)
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(2);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('BULK_IMPORTED event handling', () => {
    it('should invalidate display data when readings are bulk imported', async () => {
      const readings = [
        createReading({ _id: 'r1' }),
        createReading({ _id: 'r2' }),
        createReading({ _id: 'r3' }),
      ];

      const event: EnergyReadingsBulkImportedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.BULK_IMPORTED,
        timestamp: now,
        userId,
        data: {
          readings,
          count: 3,
        },
      };

      const bulkImportedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.BULK_IMPORTED
      )?.[1];

      expect(bulkImportedHandler).toBeDefined();

      await bulkImportedHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should invalidate only once for bulk import (not per reading)', async () => {
      const readings = Array.from({ length: 100 }, (_, i) =>
        createReading({ _id: `r${i}` })
      );

      const event: EnergyReadingsBulkImportedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.BULK_IMPORTED,
        timestamp: now,
        userId,
        data: {
          readings,
          count: 100,
        },
      };

      const bulkImportedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.BULK_IMPORTED
      )?.[1];

      await bulkImportedHandler!(event);

      // Should invalidate exactly once (performance optimization)
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(1);
    });

    it('should handle empty bulk import', async () => {
      const event: EnergyReadingsBulkImportedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.BULK_IMPORTED,
        timestamp: now,
        userId,
        data: {
          readings: [],
          count: 0,
        },
      };

      const bulkImportedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.BULK_IMPORTED
      )?.[1];

      await bulkImportedHandler!(event);

      // Should still invalidate (even for empty import)
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('unregister()', () => {
    it('should remove all event listeners', () => {
      handler.unregister();

      expect(mockEventBus.removeAllListeners).toHaveBeenCalledTimes(4);
      expect(mockEventBus.removeAllListeners).toHaveBeenCalledWith(EnergyEventTypes.CREATED);
      expect(mockEventBus.removeAllListeners).toHaveBeenCalledWith(EnergyEventTypes.UPDATED);
      expect(mockEventBus.removeAllListeners).toHaveBeenCalledWith(EnergyEventTypes.DELETED);
      expect(mockEventBus.removeAllListeners).toHaveBeenCalledWith(
        EnergyEventTypes.BULK_IMPORTED
      );
    });

    it('should be safe to call multiple times', () => {
      handler.unregister();
      handler.unregister();
      handler.unregister();

      // Should call removeAllListeners 4 times per unregister
      expect(mockEventBus.removeAllListeners).toHaveBeenCalledTimes(12);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle mixed event sequence', async () => {
      const createdEvent: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId,
        data: createReading(),
      };

      const updatedEvent: EnergyReadingUpdatedEvent = {
        eventId: 'event-2',
        eventType: EnergyEventTypes.UPDATED,
        timestamp: now,
        userId,
        data: {
          before: createReading({ amount: 1000 }),
          after: createReading({ amount: 1500 }),
        },
      };

      const deletedEvent: EnergyReadingDeletedEvent = {
        eventId: 'event-3',
        eventType: EnergyEventTypes.DELETED,
        timestamp: now,
        userId,
        data: { id: 'reading-1', reading: createReading() },
      };

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];
      const updatedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.UPDATED
      )?.[1];
      const deletedHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.DELETED
      )?.[1];

      await createdHandler!(createdEvent);
      await updatedHandler!(updatedEvent);
      await deletedHandler!(deletedEvent);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(3);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledWith(userId);
    });

    it('should handle events for different users independently', async () => {
      const user1Event: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId: 'user-1',
        data: createReading({ userId: 'user-1' }),
      };

      const user2Event: EnergyReadingCreatedEvent = {
        eventId: 'event-2',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId: 'user-2',
        data: createReading({ userId: 'user-2' }),
      };

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      await createdHandler!(user1Event);
      await createdHandler!(user2Event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(2);
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenNthCalledWith(1, 'user-1');
      expect(mockDisplayService.invalidateAllForUser).toHaveBeenNthCalledWith(2, 'user-2');
    });
  });

  describe('Error handling', () => {
    it('should propagate invalidation errors', async () => {
      const event: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId,
        data: createReading(),
      };

      mockDisplayService.invalidateAllForUser.mockRejectedValue(
        new Error('Database connection lost')
      );

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      await expect(createdHandler!(event)).rejects.toThrow('Database connection lost');
    });

    it('should not affect event bus registration on invalidation errors', async () => {
      const event: EnergyReadingCreatedEvent = {
        eventId: 'event-1',
        eventType: EnergyEventTypes.CREATED,
        timestamp: now,
        userId,
        data: createReading(),
      };

      mockDisplayService.invalidateAllForUser.mockRejectedValueOnce(
        new Error('Temporary error')
      );
      mockDisplayService.invalidateAllForUser.mockResolvedValueOnce(undefined);

      const createdHandler = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EnergyEventTypes.CREATED
      )?.[1];

      // First call fails
      await expect(createdHandler!(event)).rejects.toThrow('Temporary error');

      // Second call should still work (handler still registered)
      await createdHandler!(event);

      expect(mockDisplayService.invalidateAllForUser).toHaveBeenCalledTimes(2);
    });
  });
});
