/**
 * Energy CRUD Service
 *
 * Service layer for energy reading operations that:
 * 1. Delegates database operations to repository
 * 2. Emits events after successful mutations
 * 3. Enforces user data isolation
 *
 * Design principles:
 * - SRP: Single responsibility - CRUD + event emission
 * - DIP: Depends on abstractions (IEnergyRepository, IEventBus)
 * - OCP: Extensible via event system without modifying this service
 *
 * Event emission strategy:
 * - Individual CREATED events for single creates
 * - BULK_IMPORTED event for bulk creates (performance)
 * - Individual DELETED events for deleteMany (for accurate invalidation)
 * - Events emitted AFTER successful repository operations
 */

import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IEventBus } from '@/events/interfaces/IEventBus';
import { EnergyEventFactory } from '@/events/factories/EnergyEventFactory';
import { SourceEnergyReading, EnergyFilters, EnergyOptions } from '@/app/types';

export class EnergyCrudService {
  constructor(
    private repository: IEnergyRepository,
    private eventBus: IEventBus
  ) {}

  /**
   * Create a new energy reading and emit CREATED event
   *
   * @param reading - Energy reading data (without _id)
   * @returns Created reading with generated _id
   */
  async create(
    reading: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<SourceEnergyReading> {
    // Business logic: Default unit based on type if missing
    const readingWithUnit = {
      ...reading,
      unit: reading.unit || (reading.type === 'power' ? 'kWh' : 'm³'),
    };

    // Create via repository
    const created = await this.repository.create(readingWithUnit);

    // Emit event after successful creation
    const event = EnergyEventFactory.createCreatedEvent(created);
    await this.eventBus.emit(event);

    return created;
  }

  /**
   * Create multiple energy readings and emit BULK_IMPORTED event
   *
   * Performance optimization: Emits single BULK_IMPORTED event instead of
   * individual CREATED events to avoid overwhelming the event system.
   *
   * @param readings - Array of energy reading data
   * @returns Array of created readings with generated _ids
   */
  async createMany(
    readings: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<SourceEnergyReading[]> {
    // Business logic: Default unit based on type if missing
    const readingsWithUnits = readings.map((r) => ({
      ...r,
      unit: r.unit || (r.type === 'power' ? 'kWh' : 'm³'),
    }));

    // Create via repository
    const created = await this.repository.createMany(readingsWithUnits);

    // Emit bulk imported event (NOT individual created events - performance)
    const event = EnergyEventFactory.createBulkImportedEvent(
      created,
      created[0]?.userId || '',
      { count: created.length }
    );
    await this.eventBus.emit(event);

    return created;
  }

  /**
   * Update energy reading and emit UPDATED event
   *
   * Fetches original reading before update to include before/after data in event.
   *
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @param data - Partial data to update
   * @returns Updated reading if found, null otherwise
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<SourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SourceEnergyReading | null> {
    // Get original reading before update (needed for event)
    const before = await this.repository.findById(id, userId);
    if (!before) {
      return null;
    }

    // Update via repository
    const after = await this.repository.update(id, userId, data);
    if (!after) {
      return null;
    }

    // Emit event with before/after data
    const event = EnergyEventFactory.createUpdatedEvent(before, after);
    await this.eventBus.emit(event);

    return after;
  }

  /**
   * Delete energy reading and emit DELETED event
   *
   * Fetches reading before delete to include in event data.
   *
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @returns true if deleted, false if not found
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // Get reading before delete (needed for event)
    const reading = await this.repository.findById(id, userId);
    if (!reading) {
      return false;
    }

    // Delete via repository
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) {
      return false;
    }

    // Emit event with deleted reading data
    const event = EnergyEventFactory.createDeletedEvent(reading);
    await this.eventBus.emit(event);

    return true;
  }

  /**
   * Delete multiple energy readings and emit individual DELETED events
   *
   * Design decision: Emit individual DELETED events (not bulk) to ensure
   * accurate display data invalidation per reading.
   *
   * @param ids - Array of reading IDs
   * @param userId - User ID (for data isolation)
   * @returns Number of readings deleted
   */
  async deleteMany(ids: string[], userId: string): Promise<number> {
    // Get readings before delete (for events)
    const readings: SourceEnergyReading[] = [];
    for (const id of ids) {
      const reading = await this.repository.findById(id, userId);
      if (reading) {
        readings.push(reading);
      }
    }

    // Delete via repository
    const deletedCount = await this.repository.deleteMany(ids, userId);

    // Emit deleted event for each successfully deleted reading
    for (const reading of readings) {
      const event = EnergyEventFactory.createDeletedEvent(reading);
      await this.eventBus.emit(event);
    }

    return deletedCount;
  }

  // ============================================================================
  // Read-only methods (no events, just delegate to repository)
  // ============================================================================

  /**
   * Find a single reading by ID
   *
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @returns Reading if found, null otherwise
   */
  async findById(id: string, userId: string): Promise<SourceEnergyReading | null> {
    return this.repository.findById(id, userId);
  }

  /**
   * Find all readings for a user with optional filters
   *
   * @param userId - User ID (for data isolation)
   * @param filters - Optional filtering, sorting, pagination
   * @returns Array of readings matching criteria
   */
  async findAll(userId: string, filters?: EnergyFilters): Promise<SourceEnergyReading[]> {
    return this.repository.findAll(userId, filters);
  }

  /**
   * Find readings within a date range
   *
   * @param userId - User ID (for data isolation)
   * @param startDate - Range start (inclusive)
   * @param endDate - Range end (inclusive)
   * @param type - Optional energy type filter
   * @returns Array of readings in date range
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: EnergyOptions
  ): Promise<SourceEnergyReading[]> {
    return this.repository.findByDateRange(userId, startDate, endDate, type);
  }

  /**
   * Count readings matching filters
   *
   * @param userId - User ID (for data isolation)
   * @param filters - Optional filters
   * @returns Count of matching readings
   */
  async count(userId: string, filters?: EnergyFilters): Promise<number> {
    return this.repository.count(userId, filters);
  }

  /**
   * Get minimum and maximum dates for readings
   *
   * @param userId - User ID (for data isolation)
   * @param type - Optional energy type filter
   * @returns Object with min/max dates, or null if no readings
   */
  async getMinMaxDates(
    userId: string,
    type?: EnergyOptions
  ): Promise<{ min: Date; max: Date } | null> {
    return this.repository.getMinMaxDates(userId, type);
  }
}
