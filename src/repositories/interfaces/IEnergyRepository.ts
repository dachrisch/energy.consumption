/**
 * Energy Repository Interface
 *
 * Defines the contract for energy data persistence operations.
 * Follows the Repository pattern to abstract database operations.
 *
 * All methods enforce user data isolation by requiring userId parameter.
 */

import { EnergyFilters, EnergyOptions, SourceEnergyReading } from '@/app/types';

export interface IEnergyRepository {
  /**
   * Create a new energy reading
   * @param reading - Energy reading data (without _id)
   * @returns Created reading with generated _id
   */
  create(reading: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>): Promise<SourceEnergyReading>;

  /**
   * Create multiple energy readings in bulk
   * @param readings - Array of energy reading data
   * @returns Array of created readings with generated _ids
   */
  createMany(readings: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<SourceEnergyReading[]>;

  /**
   * Find a single reading by ID
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @returns Reading if found, null otherwise
   */
  findById(id: string, userId: string): Promise<SourceEnergyReading | null>;

  /**
   * Find all readings for a user with optional filters
   * @param userId - User ID (for data isolation)
   * @param filters - Optional filtering, sorting, pagination
   * @returns Array of readings matching criteria
   */
  findAll(userId: string, filters?: EnergyFilters): Promise<SourceEnergyReading[]>;

  /**
   * Find readings within a date range
   * @param userId - User ID (for data isolation)
   * @param startDate - Range start (inclusive)
   * @param endDate - Range end (inclusive)
   * @param type - Optional energy type filter
   * @returns Array of readings in date range
   */
  findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: EnergyOptions
  ): Promise<SourceEnergyReading[]>;

  /**
   * Update an existing reading
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @param data - Partial data to update
   * @returns Updated reading if found, null otherwise
   */
  update(
    id: string,
    userId: string,
    data: Partial<Omit<SourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SourceEnergyReading | null>;

  /**
   * Delete a single reading
   * @param id - Reading ID
   * @param userId - User ID (for data isolation)
   * @returns true if deleted, false if not found
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * Delete multiple readings
   * @param ids - Array of reading IDs
   * @param userId - User ID (for data isolation)
   * @returns Number of readings deleted
   */
  deleteMany(ids: string[], userId: string): Promise<number>;

  /**
   * Count readings matching filters
   * @param userId - User ID (for data isolation)
   * @param filters - Optional filters
   * @returns Count of matching readings
   */
  count(userId: string, filters?: EnergyFilters): Promise<number>;

  /**
   * Get minimum and maximum dates for readings
   * @param userId - User ID (for data isolation)
   * @param type - Optional energy type filter
   * @returns Object with min/max dates, or null if no readings
   */
  getMinMaxDates(
    userId: string,
    type?: EnergyOptions
  ): Promise<{ min: Date; max: Date } | null>;
}
