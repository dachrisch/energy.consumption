import { EventBus } from './EventBus';
import { IEventBus } from './interfaces/IEventBus';

/**
 * Singleton EventBus instance
 * Provides a shared event bus across the application
 */
let eventBusInstance: IEventBus | null = null;

/**
 * Get the singleton EventBus instance
 * Creates instance on first call, returns existing instance on subsequent calls
 *
 * @returns The singleton EventBus instance
 *
 * @example
 * ```typescript
 * const eventBus = getEventBus();
 * eventBus.on('ENERGY_READING_CREATED', async (event) => {
 *   console.log('New reading created:', event.data);
 * });
 * ```
 */
export function getEventBus(): IEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

/**
 * Reset the singleton EventBus instance
 * Removes all event listeners and destroys the current instance
 * Primarily used for testing to ensure clean state between tests
 *
 * @example
 * ```typescript
 * // In test teardown
 * afterEach(() => {
 *   resetEventBus();
 * });
 * ```
 */
export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.removeAllListeners();
  }
  eventBusInstance = null;
}
