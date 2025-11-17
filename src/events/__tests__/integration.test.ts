/**
 * Integration test for the complete event system
 * Demonstrates end-to-end usage of EventBus, Factory, and Types
 */
import {
  getEventBus,
  resetEventBus,
  EnergyEventFactory,
  EnergyEventTypes,
  EnergyReadingCreatedEvent,
  EnergyReadingUpdatedEvent,
  EnergyReadingDeletedEvent,
  EnergyReadingsBulkImportedEvent,
} from '../index';
import { SourceEnergyReading } from '@/app/types';

// Helper to create mock readings
const createMockReading = (overrides?: Partial<SourceEnergyReading>): SourceEnergyReading => ({
  _id: `reading-${Date.now()}-${Math.random()}`,
  userId: 'user-123',
  type: 'power',
  amount: 1000,
  date: new Date('2024-01-15T10:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Event System Integration', () => {
  let eventBus: ReturnType<typeof getEventBus>;

  beforeEach(() => {
    eventBus = getEventBus();
  });

  afterEach(() => {
    resetEventBus();
  });

  describe('Complete workflow', () => {
    it('should handle complete CRUD event workflow', async () => {
      const events: string[] = [];

      // Register handlers for all event types
      eventBus.on(EnergyEventTypes.CREATED, async (event: EnergyReadingCreatedEvent) => {
        events.push(`created:${event.data._id}`);
      });

      eventBus.on(EnergyEventTypes.UPDATED, async (event: EnergyReadingUpdatedEvent) => {
        events.push(`updated:${event.data.after._id}`);
      });

      eventBus.on(EnergyEventTypes.DELETED, async (event: EnergyReadingDeletedEvent) => {
        events.push(`deleted:${event.data.id}`);
      });

      eventBus.on(EnergyEventTypes.BULK_IMPORTED, async (event: EnergyReadingsBulkImportedEvent) => {
        events.push(`bulk:${event.data.count}`);
      });

      // Simulate CRUD operations
      const reading1 = createMockReading({ _id: 'reading-1' });
      const reading2 = createMockReading({ _id: 'reading-2' });
      const reading3 = createMockReading({ _id: 'reading-3' });

      // 1. Create reading
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading1));

      // 2. Update reading
      const updatedReading1 = { ...reading1, amount: 1500 };
      await eventBus.emit(EnergyEventFactory.createUpdatedEvent(reading1, updatedReading1));

      // 3. Bulk import
      await eventBus.emit(EnergyEventFactory.createBulkImportedEvent(
        [reading2, reading3],
        'user-123'
      ));

      // 4. Delete reading
      await eventBus.emit(EnergyEventFactory.createDeletedEvent(reading1));

      // Verify all events were handled in order
      expect(events).toEqual([
        'created:reading-1',
        'updated:reading-1',
        'bulk:2',
        'deleted:reading-1',
      ]);
    });

    it('should support multiple independent subscribers', async () => {
      const subscriber1Events: string[] = [];
      const subscriber2Events: string[] = [];
      const subscriber3Events: string[] = [];

      // Simulate different parts of the application subscribing to events
      eventBus.on(EnergyEventTypes.CREATED, async () => {
        subscriber1Events.push('cache-invalidated');
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        subscriber2Events.push('display-data-recalculated');
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        subscriber3Events.push('analytics-logged');
      });

      const reading = createMockReading();
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // All subscribers should have handled the event
      expect(subscriber1Events).toEqual(['cache-invalidated']);
      expect(subscriber2Events).toEqual(['display-data-recalculated']);
      expect(subscriber3Events).toEqual(['analytics-logged']);
    });

    it('should handle event metadata correctly', async () => {
      let receivedMetadata: Record<string, unknown> | undefined;

      eventBus.on(EnergyEventTypes.CREATED, async (event) => {
        receivedMetadata = event.metadata;
      });

      const reading = createMockReading();
      const metadata = {
        source: 'csv-import',
        filename: 'readings.csv',
        importedBy: 'admin',
        timestamp: new Date().toISOString(),
      };

      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading, metadata));

      expect(receivedMetadata).toEqual(metadata);
    });

    it('should isolate errors between handlers', async () => {
      const successfulHandlerCalls: number[] = [];

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        successfulHandlerCalls.push(1);
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        throw new Error('Handler 2 failed');
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        successfulHandlerCalls.push(3);
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        throw new Error('Handler 4 failed');
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        successfulHandlerCalls.push(5);
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const reading = createMockReading();
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // Only non-throwing handlers should have executed
      expect(successfulHandlerCalls).toEqual([1, 3, 5]);

      // Errors should have been logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });

    it('should handle async operations in handlers', async () => {
      const delays: number[] = [];

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        delays.push(50);
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        delays.push(30);
      });

      eventBus.on(EnergyEventTypes.CREATED, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        delays.push(10);
      });

      const reading = createMockReading();
      const startTime = Date.now();

      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All handlers should have executed sequentially
      expect(delays).toEqual([50, 30, 10]);

      // Total time should be at least sum of delays (sequential execution)
      expect(totalTime).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Event uniqueness', () => {
    it('should generate unique eventIds across all event types', async () => {
      const eventIds: string[] = [];

      // Register handlers that collect eventIds
      eventBus.on(EnergyEventTypes.CREATED, async (event) => {
        eventIds.push(event.eventId);
      });

      eventBus.on(EnergyEventTypes.UPDATED, async (event) => {
        eventIds.push(event.eventId);
      });

      eventBus.on(EnergyEventTypes.DELETED, async (event) => {
        eventIds.push(event.eventId);
      });

      eventBus.on(EnergyEventTypes.BULK_IMPORTED, async (event) => {
        eventIds.push(event.eventId);
      });

      const reading = createMockReading();

      // Emit multiple events of different types
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));
      await eventBus.emit(EnergyEventFactory.createUpdatedEvent(reading, reading));
      await eventBus.emit(EnergyEventFactory.createDeletedEvent(reading));
      await eventBus.emit(EnergyEventFactory.createBulkImportedEvent([reading], 'user-123'));

      // All eventIds should be unique
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
      expect(eventIds.length).toBe(4);
    });
  });

  describe('Subscriber lifecycle', () => {
    it('should allow dynamic subscription and unsubscription', async () => {
      const calls: string[] = [];

      // Initial handler
      const unsubscribe1 = eventBus.on(EnergyEventTypes.CREATED, async () => {
        calls.push('handler1');
      });

      const reading = createMockReading();

      // First emission - handler1 active
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // Add second handler
      const unsubscribe2 = eventBus.on(EnergyEventTypes.CREATED, async () => {
        calls.push('handler2');
      });

      // Second emission - both handlers active
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // Remove first handler
      unsubscribe1();

      // Third emission - only handler2 active
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // Add third handler
      eventBus.on(EnergyEventTypes.CREATED, async () => {
        calls.push('handler3');
      });

      // Fourth emission - handler2 and handler3 active
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      // Remove second handler
      unsubscribe2();

      // Fifth emission - only handler3 active
      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));

      expect(calls).toEqual([
        'handler1',
        'handler1', 'handler2',
        'handler2',
        'handler2', 'handler3',
        'handler3',
      ]);
    });
  });

  describe('Type safety', () => {
    it('should maintain type safety throughout event flow', async () => {
      let receivedCreatedEvent: EnergyReadingCreatedEvent | null = null;
      let receivedUpdatedEvent: EnergyReadingUpdatedEvent | null = null;
      let receivedDeletedEvent: EnergyReadingDeletedEvent | null = null;
      let receivedBulkEvent: EnergyReadingsBulkImportedEvent | null = null;

      eventBus.on(EnergyEventTypes.CREATED, async (event: EnergyReadingCreatedEvent) => {
        receivedCreatedEvent = event;
        // Type-safe access to event.data (SourceEnergyReading)
        const amount: number = event.data.amount;
        expect(typeof amount).toBe('number');
      });

      eventBus.on(EnergyEventTypes.UPDATED, async (event: EnergyReadingUpdatedEvent) => {
        receivedUpdatedEvent = event;
        // Type-safe access to event.data.before and event.data.after
        const beforeAmount: number = event.data.before.amount;
        const afterAmount: number = event.data.after.amount;
        expect(typeof beforeAmount).toBe('number');
        expect(typeof afterAmount).toBe('number');
      });

      eventBus.on(EnergyEventTypes.DELETED, async (event: EnergyReadingDeletedEvent) => {
        receivedDeletedEvent = event;
        // Type-safe access to event.data.id and event.data.reading
        const id: string = event.data.id;
        const reading: SourceEnergyReading = event.data.reading;
        expect(typeof id).toBe('string');
        expect(typeof reading.amount).toBe('number');
      });

      eventBus.on(EnergyEventTypes.BULK_IMPORTED, async (event: EnergyReadingsBulkImportedEvent) => {
        receivedBulkEvent = event;
        // Type-safe access to event.data.readings and event.data.count
        const readings: SourceEnergyReading[] = event.data.readings;
        const count: number = event.data.count;
        expect(Array.isArray(readings)).toBe(true);
        expect(typeof count).toBe('number');
      });

      const reading = createMockReading();

      await eventBus.emit(EnergyEventFactory.createCreatedEvent(reading));
      await eventBus.emit(EnergyEventFactory.createUpdatedEvent(reading, reading));
      await eventBus.emit(EnergyEventFactory.createDeletedEvent(reading));
      await eventBus.emit(EnergyEventFactory.createBulkImportedEvent([reading], 'user-123'));

      // All events should have been received
      expect(receivedCreatedEvent).not.toBeNull();
      expect(receivedUpdatedEvent).not.toBeNull();
      expect(receivedDeletedEvent).not.toBeNull();
      expect(receivedBulkEvent).not.toBeNull();
    });
  });
});
