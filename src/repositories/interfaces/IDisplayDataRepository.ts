/**
 * Display Data Repository Interface
 *
 * Defines the contract for pre-calculated display data persistence.
 * Display data is cached, computed data derived from source readings.
 *
 * All methods enforce user data isolation by requiring userId parameter.
 */

import { DisplayDataType, DisplayEnergyData } from '@/app/types';

export interface IDisplayDataRepository {
  /**
   * Upsert (insert or update) display data
   * If data for this userId + displayType exists, it will be replaced.
   * @param data - Display data to upsert
   * @returns Upserted display data
   */
  upsert(data: Omit<DisplayEnergyData, '_id'>): Promise<DisplayEnergyData>;

  /**
   * Find display data by type
   * @param userId - User ID (for data isolation)
   * @param displayType - Type of display data to retrieve
   * @returns Display data if found, null otherwise
   */
  findByType(userId: string, displayType: DisplayDataType): Promise<DisplayEnergyData | null>;

  /**
   * Find display data by type with additional filters
   * @param userId - User ID (for data isolation)
   * @param displayType - Type of display data to retrieve
   * @param filters - Additional filters to match in metadata
   * @returns Display data if found, null otherwise
   */
  findByTypeAndFilters(
    userId: string,
    displayType: DisplayDataType,
    filters: Record<string, unknown>
  ): Promise<DisplayEnergyData | null>;

  /**
   * Delete display data by type
   * @param userId - User ID (for data isolation)
   * @param displayType - Type of display data to delete
   * @returns true if deleted, false if not found
   */
  deleteByType(userId: string, displayType: DisplayDataType): Promise<boolean>;

  /**
   * Delete all display data for a user
   * @param userId - User ID (for data isolation)
   * @returns Number of records deleted
   */
  deleteAllForUser(userId: string): Promise<number>;

  /**
   * Invalidate all display data for a user
   * This soft-deletes or marks data for recalculation
   * @param userId - User ID (for data isolation)
   * @returns Number of records invalidated
   */
  invalidateForUser(userId: string): Promise<number>;
}
