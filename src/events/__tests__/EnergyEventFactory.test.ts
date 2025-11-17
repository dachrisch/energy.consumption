import { EnergyEventFactory } from '../factories/EnergyEventFactory';
import {
  EnergyEventTypes,
  EnergyReadingCreatedEvent,
  EnergyReadingUpdatedEvent,
  EnergyReadingDeletedEvent,
  EnergyReadingsBulkImportedEvent,
} from '../types/EnergyEvents';
import { SourceEnergyReading } from '@/app/types';

// Helper to create mock SourceEnergyReading
const createMockReading = (overrides?: Partial<SourceEnergyReading>): SourceEnergyReading => ({
  _id: 'reading-123',
  userId: 'user-456',
  type: 'power',
  amount: 1234.5,
  date: new Date('2024-01-15T10:30:00Z'),
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  ...overrides,
});

describe('EnergyEventFactory', () => {
  describe('createCreatedEvent', () => {
    it('should create valid ENERGY_READING_CREATED event', () => {
      const reading = createMockReading();
      const event = EnergyEventFactory.createCreatedEvent(reading);

      expect(event.eventType).toBe(EnergyEventTypes.CREATED);
      expect(event.data).toBe(reading);
      expect(event.userId).toBe(reading.userId);
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.eventId.length).toBeGreaterThan(0);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.metadata).toBeUndefined();
    });

    it('should generate unique event IDs', () => {
      const reading = createMockReading();
      const event1 = EnergyEventFactory.createCreatedEvent(reading);
      const event2 = EnergyEventFactory.createCreatedEvent(reading);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should create event with recent timestamp', () => {
      const before = new Date();
      const reading = createMockReading();
      const event = EnergyEventFactory.createCreatedEvent(reading);
      const after = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include optional metadata when provided', () => {
      const reading = createMockReading();
      const metadata = { source: 'csv-import', batchId: 'batch-789' };
      const event = EnergyEventFactory.createCreatedEvent(reading, metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should propagate userId from reading', () => {
      const reading = createMockReading({ userId: 'custom-user-123' });
      const event = EnergyEventFactory.createCreatedEvent(reading);

      expect(event.userId).toBe('custom-user-123');
    });

    it('should handle different energy types', () => {
      const powerReading = createMockReading({ type: 'power' });
      const gasReading = createMockReading({ type: 'gas' });

      const powerEvent = EnergyEventFactory.createCreatedEvent(powerReading);
      const gasEvent = EnergyEventFactory.createCreatedEvent(gasReading);

      expect(powerEvent.data.type).toBe('power');
      expect(gasEvent.data.type).toBe('gas');
    });
  });

  describe('createUpdatedEvent', () => {
    it('should create valid ENERGY_READING_UPDATED event', () => {
      const before = createMockReading({ amount: 1000 });
      const after = createMockReading({ amount: 1234.5 });
      const event = EnergyEventFactory.createUpdatedEvent(before, after);

      expect(event.eventType).toBe(EnergyEventTypes.UPDATED);
      expect(event.data.before).toBe(before);
      expect(event.data.after).toBe(after);
      expect(event.userId).toBe(after.userId);
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.metadata).toBeUndefined();
    });

    it('should generate unique event IDs', () => {
      const before = createMockReading({ amount: 1000 });
      const after = createMockReading({ amount: 1234.5 });

      const event1 = EnergyEventFactory.createUpdatedEvent(before, after);
      const event2 = EnergyEventFactory.createUpdatedEvent(before, after);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should create event with recent timestamp', () => {
      const beforeTime = new Date();
      const before = createMockReading({ amount: 1000 });
      const after = createMockReading({ amount: 1234.5 });
      const event = EnergyEventFactory.createUpdatedEvent(before, after);
      const afterTime = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should include optional metadata when provided', () => {
      const before = createMockReading({ amount: 1000 });
      const after = createMockReading({ amount: 1234.5 });
      const metadata = { reason: 'correction', updatedBy: 'user-789' };
      const event = EnergyEventFactory.createUpdatedEvent(before, after, metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should use userId from after reading', () => {
      const before = createMockReading({ userId: 'user-old', amount: 1000 });
      const after = createMockReading({ userId: 'user-new', amount: 1234.5 });
      const event = EnergyEventFactory.createUpdatedEvent(before, after);

      expect(event.userId).toBe('user-new');
    });

    it('should preserve both before and after states completely', () => {
      const before = createMockReading({
        _id: 'reading-1',
        type: 'power',
        amount: 1000,
        date: new Date('2024-01-15T10:00:00Z'),
      });
      const after = createMockReading({
        _id: 'reading-1',
        type: 'power',
        amount: 1234.5,
        date: new Date('2024-01-15T10:00:00Z'),
      });

      const event = EnergyEventFactory.createUpdatedEvent(before, after);

      expect(event.data.before).toEqual(before);
      expect(event.data.after).toEqual(after);
    });
  });

  describe('createDeletedEvent', () => {
    it('should create valid ENERGY_READING_DELETED event', () => {
      const reading = createMockReading();
      const event = EnergyEventFactory.createDeletedEvent(reading);

      expect(event.eventType).toBe(EnergyEventTypes.DELETED);
      expect(event.data.id).toBe(reading._id);
      expect(event.data.reading).toBe(reading);
      expect(event.userId).toBe(reading.userId);
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.metadata).toBeUndefined();
    });

    it('should generate unique event IDs', () => {
      const reading = createMockReading();
      const event1 = EnergyEventFactory.createDeletedEvent(reading);
      const event2 = EnergyEventFactory.createDeletedEvent(reading);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should create event with recent timestamp', () => {
      const before = new Date();
      const reading = createMockReading();
      const event = EnergyEventFactory.createDeletedEvent(reading);
      const after = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include optional metadata when provided', () => {
      const reading = createMockReading();
      const metadata = { reason: 'duplicate', deletedBy: 'admin-123' };
      const event = EnergyEventFactory.createDeletedEvent(reading, metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should propagate userId from reading', () => {
      const reading = createMockReading({ userId: 'user-to-delete' });
      const event = EnergyEventFactory.createDeletedEvent(reading);

      expect(event.userId).toBe('user-to-delete');
    });

    it('should include both id and full reading in data', () => {
      const reading = createMockReading({ _id: 'reading-to-delete-123' });
      const event = EnergyEventFactory.createDeletedEvent(reading);

      expect(event.data.id).toBe('reading-to-delete-123');
      expect(event.data.reading).toEqual(reading);
    });
  });

  describe('createBulkImportedEvent', () => {
    it('should create valid ENERGY_READINGS_BULK_IMPORTED event', () => {
      const readings = [
        createMockReading({ _id: 'reading-1', amount: 1000 }),
        createMockReading({ _id: 'reading-2', amount: 2000 }),
        createMockReading({ _id: 'reading-3', amount: 3000 }),
      ];
      const userId = 'importer-user-123';
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId);

      expect(event.eventType).toBe(EnergyEventTypes.BULK_IMPORTED);
      expect(event.data.readings).toBe(readings);
      expect(event.data.count).toBe(3);
      expect(event.userId).toBe(userId);
      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.metadata).toBeUndefined();
    });

    it('should generate unique event IDs', () => {
      const readings = [createMockReading()];
      const userId = 'user-123';

      const event1 = EnergyEventFactory.createBulkImportedEvent(readings, userId);
      const event2 = EnergyEventFactory.createBulkImportedEvent(readings, userId);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should create event with recent timestamp', () => {
      const before = new Date();
      const readings = [createMockReading()];
      const userId = 'user-123';
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId);
      const after = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include optional metadata when provided', () => {
      const readings = [createMockReading()];
      const userId = 'user-123';
      const metadata = { source: 'csv', filename: 'readings.csv', importedBy: 'admin' };
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId, metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should handle empty readings array', () => {
      const readings: SourceEnergyReading[] = [];
      const userId = 'user-123';
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId);

      expect(event.data.readings).toEqual([]);
      expect(event.data.count).toBe(0);
    });

    it('should handle large readings array', () => {
      const readings = Array.from({ length: 100 }, (_, i) =>
        createMockReading({ _id: `reading-${i}`, amount: i * 100 })
      );
      const userId = 'user-123';
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId);

      expect(event.data.readings).toBe(readings);
      expect(event.data.count).toBe(100);
      expect(event.data.readings.length).toBe(100);
    });

    it('should correctly count readings regardless of array contents', () => {
      const readings = [
        createMockReading({ amount: 1 }),
        createMockReading({ amount: 2 }),
        createMockReading({ amount: 3 }),
        createMockReading({ amount: 4 }),
        createMockReading({ amount: 5 }),
      ];
      const userId = 'user-123';
      const event = EnergyEventFactory.createBulkImportedEvent(readings, userId);

      expect(event.data.count).toBe(readings.length);
    });
  });

  describe('type safety', () => {
    it('should create events with correct discriminated union types', () => {
      const reading = createMockReading();
      const userId = 'user-123';

      const createdEvent: EnergyReadingCreatedEvent = EnergyEventFactory.createCreatedEvent(reading);
      const updatedEvent: EnergyReadingUpdatedEvent = EnergyEventFactory.createUpdatedEvent(reading, reading);
      const deletedEvent: EnergyReadingDeletedEvent = EnergyEventFactory.createDeletedEvent(reading);
      const bulkEvent: EnergyReadingsBulkImportedEvent = EnergyEventFactory.createBulkImportedEvent([reading], userId);

      expect(createdEvent.eventType).toBe('ENERGY_READING_CREATED');
      expect(updatedEvent.eventType).toBe('ENERGY_READING_UPDATED');
      expect(deletedEvent.eventType).toBe('ENERGY_READING_DELETED');
      expect(bulkEvent.eventType).toBe('ENERGY_READINGS_BULK_IMPORTED');
    });
  });

  describe('eventId uniqueness across factory methods', () => {
    it('should generate unique IDs across different factory methods', () => {
      const reading = createMockReading();
      const userId = 'user-123';

      const createdEvent = EnergyEventFactory.createCreatedEvent(reading);
      const updatedEvent = EnergyEventFactory.createUpdatedEvent(reading, reading);
      const deletedEvent = EnergyEventFactory.createDeletedEvent(reading);
      const bulkEvent = EnergyEventFactory.createBulkImportedEvent([reading], userId);

      const eventIds = [
        createdEvent.eventId,
        updatedEvent.eventId,
        deletedEvent.eventId,
        bulkEvent.eventId,
      ];

      // All event IDs should be unique
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
    });
  });
});
