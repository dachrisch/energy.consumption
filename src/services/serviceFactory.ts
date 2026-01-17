/**
 * Service Factory
 *
 * Provides singleton instances of services with proper dependency injection.
 * Manages service lifecycle and dependencies.
 *
 * Design principles:
 * - Singleton pattern: One instance per service type
 * - Lazy initialization: Services created on first use
 * - Proper cleanup: Reset function for testing
 * - Dependency injection: Services get their dependencies via constructor
 *
 * Service initialization order:
 * 1. Repositories (MongoDB implementations)
 * 2. EventBus (singleton)
 * 3. CRUD services (depend on repositories + eventBus)
 * 4. Display services (depend on repositories)
 * 5. Event handlers (depend on display service + eventBus)
 *
 * Usage:
 * ```typescript
 * const energyService = getEnergyCrudService();
 * const displayService = getDisplayDataService();
 * initializeEventHandlers(); // Start event handling
 * ```
 */

import { MongoEnergyRepository } from '@/repositories/mongodb/MongoEnergyRepository';
import { MongoDisplayDataRepository } from '@/repositories/mongodb/MongoDisplayDataRepository';
import { MongoContractRepository } from '@/repositories/mongodb/MongoContractRepository';
import { getEventBus } from '@/events';
import { EnergyCrudService } from './energy/EnergyCrudService';
import { DisplayDataCalculationService } from './display/DisplayDataCalculationService';
import { DisplayDataEventHandler } from './handlers/DisplayDataEventHandler';
import { ProjectionService } from './projections/ProjectionService';

// Singleton instances
let energyCrudService: EnergyCrudService | null = null;
let displayDataService: DisplayDataCalculationService | null = null;
let eventHandler: DisplayDataEventHandler | null = null;
let projectionService: ProjectionService | null = null;

/**
 * Get singleton instance of EnergyCrudService
 *
 * Lazy initialization: Creates service on first call
 * Dependencies: MongoEnergyRepository, EventBus
 *
 * @returns EnergyCrudService instance
 */
export function getEnergyCrudService(): EnergyCrudService {
  if (!energyCrudService) {
    const repository = new MongoEnergyRepository();
    const eventBus = getEventBus();
    energyCrudService = new EnergyCrudService(repository, eventBus);
  }
  return energyCrudService;
}

/**
 * Get singleton instance of DisplayDataCalculationService
 *
 * Lazy initialization: Creates service on first call
 * Dependencies: MongoEnergyRepository, MongoDisplayDataRepository
 *
 * @returns DisplayDataCalculationService instance
 */
export function getDisplayDataService(): DisplayDataCalculationService {
  if (!displayDataService) {
    const energyRepository = new MongoEnergyRepository();
    const displayRepository = new MongoDisplayDataRepository();
    displayDataService = new DisplayDataCalculationService(
      energyRepository,
      displayRepository
    );
  }
  return displayDataService;
}

/**
 * Initialize event handlers
 *
 * Creates DisplayDataEventHandler which registers event listeners.
 * Should be called once during application startup.
 *
 * Note: Event handlers are active immediately after initialization.
 * They will start listening for energy reading events and invalidating
 * display data automatically.
 *
 * @returns DisplayDataEventHandler instance (for cleanup/unregister)
 */
export function initializeEventHandlers(): DisplayDataEventHandler {
  if (!eventHandler) {
    const displayService = getDisplayDataService();
    const eventBus = getEventBus();
    eventHandler = new DisplayDataEventHandler(displayService, eventBus);
  }
  return eventHandler;
}

/**
 * Get singleton instance of ProjectionService
 *
 * Lazy initialization: Creates service on first call
 * Dependencies: MongoEnergyRepository, MongoContractRepository
 *
 * @returns ProjectionService instance
 */
export function getProjectionService(): ProjectionService {
  if (!projectionService) {
    const energyRepository = new MongoEnergyRepository();
    const contractRepository = new MongoContractRepository();
    projectionService = new ProjectionService(
      energyRepository,
      contractRepository
    );
  }
  return projectionService;
}

/**
 * Reset all service singletons
 *
 * FOR TESTING ONLY: Clears all singleton instances and unregisters event handlers.
 * Allows tests to start with clean state.
 *
 * In production, services should remain singletons for the application lifetime.
 */
export function resetServices(): void {
  // Unregister event handlers before clearing
  if (eventHandler) {
    eventHandler.unregister();
  }

  // Clear singleton references
  energyCrudService = null;
  displayDataService = null;
  eventHandler = null;
  projectionService = null;
}
