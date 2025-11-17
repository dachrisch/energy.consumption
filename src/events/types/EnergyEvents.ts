import { SourceEnergyReading } from '@/app/types';

/**
 * Base event interface - all events extend this
 */
export interface BaseEvent {
  /** Unique identifier for this event instance */
  eventId: string;
  /** Type of event (e.g., 'ENERGY_READING_CREATED') */
  eventType: string;
  /** When the event was created */
  timestamp: Date;
  /** User who triggered the event */
  userId: string;
  /** Optional metadata for debugging/logging */
  metadata?: Record<string, unknown>;
}

/**
 * Event emitted when a new energy reading is created
 */
export interface EnergyReadingCreatedEvent extends BaseEvent {
  eventType: 'ENERGY_READING_CREATED';
  data: SourceEnergyReading;
}

/**
 * Event emitted when an energy reading is updated
 */
export interface EnergyReadingUpdatedEvent extends BaseEvent {
  eventType: 'ENERGY_READING_UPDATED';
  data: {
    before: SourceEnergyReading;
    after: SourceEnergyReading;
  };
}

/**
 * Event emitted when an energy reading is deleted
 */
export interface EnergyReadingDeletedEvent extends BaseEvent {
  eventType: 'ENERGY_READING_DELETED';
  data: {
    id: string;
    reading: SourceEnergyReading;
  };
}

/**
 * Event emitted when multiple energy readings are imported in bulk
 */
export interface EnergyReadingsBulkImportedEvent extends BaseEvent {
  eventType: 'ENERGY_READINGS_BULK_IMPORTED';
  data: {
    readings: SourceEnergyReading[];
    count: number;
  };
}

/**
 * Union type for all energy events
 */
export type EnergyEvent =
  | EnergyReadingCreatedEvent
  | EnergyReadingUpdatedEvent
  | EnergyReadingDeletedEvent
  | EnergyReadingsBulkImportedEvent;

/**
 * Event type constants for type-safe event handling
 */
export const EnergyEventTypes = {
  CREATED: 'ENERGY_READING_CREATED' as const,
  UPDATED: 'ENERGY_READING_UPDATED' as const,
  DELETED: 'ENERGY_READING_DELETED' as const,
  BULK_IMPORTED: 'ENERGY_READINGS_BULK_IMPORTED' as const,
} as const;
