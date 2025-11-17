/**
 * Event System - Entry Point
 *
 * Provides event-driven architecture for the energy consumption application
 * All exports organized for easy consumption
 */

// EventBus singleton
export { getEventBus, resetEventBus } from './eventBusInstance';

// EventBus interface and implementation (for testing/DI)
export type { IEventBus, EventHandler } from './interfaces/IEventBus';
export { EventBus } from './EventBus';

// Event types
export type {
  BaseEvent,
  EnergyEvent,
  EnergyReadingCreatedEvent,
  EnergyReadingUpdatedEvent,
  EnergyReadingDeletedEvent,
  EnergyReadingsBulkImportedEvent,
} from './types/EnergyEvents';
export { EnergyEventTypes } from './types/EnergyEvents';

// Event factory
export { EnergyEventFactory } from './factories/EnergyEventFactory';
