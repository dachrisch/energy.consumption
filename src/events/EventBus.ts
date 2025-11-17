import { BaseEvent } from './types/EnergyEvents';
import { IEventBus, EventHandler } from './interfaces/IEventBus';

/**
 * In-memory EventBus implementation for event-driven architecture
 *
 * Features:
 * - Synchronous event processing (handlers execute sequentially)
 * - Error isolation (one handler failure doesn't stop others)
 * - FIFO handler execution (handlers execute in registration order)
 * - Thread-safe handler registration/removal
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 *
 * // Register handler
 * const unsubscribe = eventBus.on('ENERGY_READING_CREATED', async (event) => {
 *   console.log('New reading:', event.data);
 * });
 *
 * // Emit event
 * await eventBus.emit({
 *   eventId: '123',
 *   eventType: 'ENERGY_READING_CREATED',
 *   timestamp: new Date(),
 *   userId: 'user1',
 *   data: { reading },
 * });
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export class EventBus implements IEventBus {
  /**
   * Map of event type to array of handlers
   * Handlers stored in registration order (FIFO)
   */
  private handlers: Map<string, EventHandler<BaseEvent>[]>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Emit an event to all registered handlers
   * Handlers are executed sequentially in registration order
   * Errors in one handler do not stop execution of others
   *
   * @param event - The event to emit
   */
  async emit<T extends BaseEvent>(event: T): Promise<void> {
    // Create a snapshot of handlers to avoid issues if handlers
    // are added/removed during emission
    const handlers = [...(this.handlers.get(event.eventType) || [])];

    // Execute handlers sequentially
    for (const handler of handlers) {
      try {
        await handler(event as BaseEvent);
      } catch (error) {
        // Log error but continue with other handlers (error isolation)
        console.error(`Event handler error for ${event.eventType}:`, error);
      }
    }
  }

  /**
   * Register an event handler for a specific event type
   * Handlers are executed in the order they are registered (FIFO)
   *
   * @param eventType - The event type to listen for
   * @param handler - The handler function to execute
   * @returns Unsubscribe function to remove this handler
   */
  on<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    // Get existing handlers or create new array
    const existingHandlers = this.handlers.get(eventType) || [];

    // Add new handler (cast to BaseEvent handler for storage)
    existingHandlers.push(handler as EventHandler<BaseEvent>);

    // Store updated handlers
    this.handlers.set(eventType, existingHandlers);

    // Return unsubscribe function
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Remove a specific event handler
   * Only removes the first occurrence if handler is registered multiple times
   *
   * @param eventType - The event type
   * @param handler - The handler function to remove
   */
  off<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const existingHandlers = this.handlers.get(eventType);

    if (!existingHandlers) {
      return; // No handlers registered for this event type
    }

    // Find and remove first occurrence of handler
    const index = existingHandlers.indexOf(handler as EventHandler<BaseEvent>);

    if (index !== -1) {
      existingHandlers.splice(index, 1);

      // If no handlers left, remove the entry from map
      if (existingHandlers.length === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Remove all handlers for an event type (or all handlers if no type specified)
   *
   * @param eventType - Optional event type to clear (clears all if omitted)
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      // Remove handlers for specific event type
      this.handlers.delete(eventType);
    } else {
      // Remove all handlers for all event types
      this.handlers.clear();
    }
  }

  /**
   * Get the number of handlers registered for an event type
   *
   * @param eventType - The event type to count
   * @returns Number of registered handlers
   */
  listenerCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.length : 0;
  }
}
