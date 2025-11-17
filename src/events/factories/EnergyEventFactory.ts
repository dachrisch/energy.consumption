import { randomUUID } from 'crypto';
import {
  EnergyReadingCreatedEvent,
  EnergyReadingUpdatedEvent,
  EnergyReadingDeletedEvent,
  EnergyReadingsBulkImportedEvent,
  EnergyEventTypes,
} from '../types/EnergyEvents';
import { SourceEnergyReading } from '@/app/types';

/**
 * Factory for creating energy-related events
 * Provides type-safe event creation with automatic eventId and timestamp generation
 *
 * @example
 * ```typescript
 * const event = EnergyEventFactory.createCreatedEvent(reading);
 * await eventBus.emit(event);
 * ```
 */
export class EnergyEventFactory {
  /**
   * Create an ENERGY_READING_CREATED event
   *
   * @param reading - The newly created reading
   * @param metadata - Optional metadata for debugging/logging
   * @returns EnergyReadingCreatedEvent
   */
  static createCreatedEvent(
    reading: SourceEnergyReading,
    metadata?: Record<string, unknown>
  ): EnergyReadingCreatedEvent {
    return {
      eventId: randomUUID(),
      eventType: EnergyEventTypes.CREATED,
      timestamp: new Date(),
      userId: reading.userId,
      data: reading,
      metadata,
    };
  }

  /**
   * Create an ENERGY_READING_UPDATED event
   *
   * @param before - The reading state before update
   * @param after - The reading state after update
   * @param metadata - Optional metadata for debugging/logging
   * @returns EnergyReadingUpdatedEvent
   */
  static createUpdatedEvent(
    before: SourceEnergyReading,
    after: SourceEnergyReading,
    metadata?: Record<string, unknown>
  ): EnergyReadingUpdatedEvent {
    return {
      eventId: randomUUID(),
      eventType: EnergyEventTypes.UPDATED,
      timestamp: new Date(),
      userId: after.userId,
      data: { before, after },
      metadata,
    };
  }

  /**
   * Create an ENERGY_READING_DELETED event
   *
   * @param reading - The reading being deleted
   * @param metadata - Optional metadata for debugging/logging
   * @returns EnergyReadingDeletedEvent
   */
  static createDeletedEvent(
    reading: SourceEnergyReading,
    metadata?: Record<string, unknown>
  ): EnergyReadingDeletedEvent {
    return {
      eventId: randomUUID(),
      eventType: EnergyEventTypes.DELETED,
      timestamp: new Date(),
      userId: reading.userId,
      data: {
        id: reading._id,
        reading,
      },
      metadata,
    };
  }

  /**
   * Create an ENERGY_READINGS_BULK_IMPORTED event
   *
   * @param readings - The readings that were imported
   * @param userId - The user who performed the import
   * @param metadata - Optional metadata for debugging/logging
   * @returns EnergyReadingsBulkImportedEvent
   */
  static createBulkImportedEvent(
    readings: SourceEnergyReading[],
    userId: string,
    metadata?: Record<string, unknown>
  ): EnergyReadingsBulkImportedEvent {
    return {
      eventId: randomUUID(),
      eventType: EnergyEventTypes.BULK_IMPORTED,
      timestamp: new Date(),
      userId,
      data: {
        readings,
        count: readings.length,
      },
      metadata,
    };
  }
}
