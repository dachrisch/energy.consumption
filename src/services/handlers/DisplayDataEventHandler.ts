/**
 * Display Data Event Handler
 *
 * Connects energy data changes to display data invalidation:
 * - Listens to energy reading events (CREATED, UPDATED, DELETED, BULK_IMPORTED)
 * - Invalidates display data when source data changes
 * - Ensures display data stays in sync with source data
 *
 * Design principles:
 * - SRP: Single responsibility - coordinate events → invalidation
 * - DIP: Depends on abstractions (DisplayDataCalculationService, IEventBus)
 * - OCP: Easy to add new event types without modifying existing handlers
 *
 * Event handling strategy:
 * - CREATED: Invalidate all display data for user
 * - UPDATED: Invalidate all display data for user
 * - DELETED: Invalidate all display data for user
 * - BULK_IMPORTED: Invalidate all display data for user (once, not per reading)
 *
 * Phase 1 simplification: Invalidate ALL display data on ANY change
 * Future optimization: Invalidate only affected display data (e.g., only specific year/type)
 */

import { IEventBus } from '@/events/interfaces/IEventBus';
import { EnergyEventTypes } from '@/events/types/EnergyEvents';
import { DisplayDataCalculationService } from '../display/DisplayDataCalculationService';

export class DisplayDataEventHandler {
  constructor(
    private displayService: DisplayDataCalculationService,
    private eventBus: IEventBus
  ) {
    this.registerHandlers();
  }

  /**
   * Register event handlers for energy data changes
   *
   * Registers handlers in constructor so they're active immediately
   * after service instantiation.
   */
  private registerHandlers(): void {
    // When reading created, invalidate display data
    this.eventBus.on(EnergyEventTypes.CREATED, async (event) => {
      await this.displayService.invalidateAllForUser(event.userId);
    });

    // When reading updated, invalidate display data
    this.eventBus.on(EnergyEventTypes.UPDATED, async (event) => {
      await this.displayService.invalidateAllForUser(event.userId);
    });

    // When reading deleted, invalidate display data
    this.eventBus.on(EnergyEventTypes.DELETED, async (event) => {
      await this.displayService.invalidateAllForUser(event.userId);
    });

    // When bulk imported, invalidate display data
    this.eventBus.on(EnergyEventTypes.BULK_IMPORTED, async (event) => {
      await this.displayService.invalidateAllForUser(event.userId);
    });
  }

  /**
   * Unregister all event handlers (for cleanup)
   *
   * Call this when shutting down the service or during testing cleanup.
   * Removes all listeners to prevent memory leaks.
   */
  unregister(): void {
    this.eventBus.removeAllListeners(EnergyEventTypes.CREATED);
    this.eventBus.removeAllListeners(EnergyEventTypes.UPDATED);
    this.eventBus.removeAllListeners(EnergyEventTypes.DELETED);
    this.eventBus.removeAllListeners(EnergyEventTypes.BULK_IMPORTED);
  }
}
