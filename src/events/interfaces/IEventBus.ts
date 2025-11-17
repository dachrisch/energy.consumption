import { BaseEvent } from '../types/EnergyEvents';

/**
 * Event handler function type
 * @template T - The event type this handler processes
 */
export type EventHandler<T extends BaseEvent> = (event: T) => Promise<void>;

/**
 * EventBus interface for event-driven architecture
 * Provides pub/sub pattern for decoupled event handling
 */
export interface IEventBus {
  /**
   * Emit an event to all registered handlers
   * Handlers are executed sequentially in registration order
   * Errors in one handler do not stop execution of others
   *
   * @param event - The event to emit
   * @returns Promise that resolves when all handlers complete
   */
  emit<T extends BaseEvent>(event: T): Promise<void>;

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
  ): () => void;

  /**
   * Remove a specific event handler
   *
   * @param eventType - The event type
   * @param handler - The handler function to remove
   */
  off<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;

  /**
   * Remove all handlers for an event type (or all handlers if no type specified)
   *
   * @param eventType - Optional event type to clear (clears all if omitted)
   */
  removeAllListeners(eventType?: string): void;

  /**
   * Get the number of handlers registered for an event type
   *
   * @param eventType - The event type to count
   * @returns Number of registered handlers
   */
  listenerCount(eventType: string): number;
}
