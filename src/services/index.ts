/**
 * Service Layer - Entry Point
 *
 * Provides clean exports for service layer components.
 * Organized by category for easy consumption.
 */

// Service implementations
export { EnergyCrudService } from './energy/EnergyCrudService';
export { DisplayDataCalculationService } from './display/DisplayDataCalculationService';
export { DisplayDataEventHandler } from './handlers/DisplayDataEventHandler';

// Service factory (recommended way to get service instances)
export {
  getEnergyCrudService,
  getDisplayDataService,
  initializeEventHandlers,
  resetServices,
} from './serviceFactory';
