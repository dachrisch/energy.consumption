/**
 * MongoDB Display Data Repository Implementation
 *
 * Concrete implementation of IDisplayDataRepository using Mongoose.
 * Provides data access layer for pre-calculated display data.
 *
 * Features:
 * - User data isolation enforced on all queries
 * - Upsert operations for cache-like behavior
 * - Composite unique index (userId + displayType)
 * - Invalidation support for cache clearing
 * - SOLID principles: Single responsibility, dependency inversion
 */

import { IDisplayDataRepository } from '../interfaces/IDisplayDataRepository';
import { DisplayDataType, DisplayEnergyData as DisplayEnergyDataType } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import DisplayEnergyData from '@/models/DisplayEnergyData';

export class MongoDisplayDataRepository implements IDisplayDataRepository {
  /**
   * Upsert (insert or update) display data
   * Uses composite key (userId + displayType) for upsert
   */
  async upsert(data: Omit<DisplayEnergyDataType, '_id'>): Promise<DisplayEnergyDataType> {
    await connectDB();

    return await DisplayEnergyData.findOneAndUpdate(
      { userId: data.userId, displayType: data.displayType },
      data,
      { upsert: true, new: true }
    )
      .where({ userId: data.userId })
      .exec();
  }

  /**
   * Find display data by type with user isolation
   */
  async findByType(userId: string, displayType: DisplayDataType): Promise<DisplayEnergyDataType | null> {
    await connectDB();

    return await DisplayEnergyData.findOne({
      userId,
      displayType,
    }).exec();
  }

  /**
   * Find display data by type with additional filter criteria
   */
  async findByTypeAndFilters(
    userId: string,
    displayType: DisplayDataType,
    filters: Record<string, unknown>
  ): Promise<DisplayEnergyDataType | null> {
    await connectDB();

    // Build query with individual filter fields to avoid key-order sensitivity
    const query: Record<string, any> = {
      userId,
      displayType,
    };

    // Add each filter as a metadata.filters.KEY field
    Object.keys(filters).forEach((key) => {
      query[`metadata.filters.${key}`] = filters[key];
    });

    return await DisplayEnergyData.findOne(query).exec();
  }

  /**
   * Delete display data by type with user isolation
   */
  async deleteByType(userId: string, displayType: DisplayDataType): Promise<boolean> {
    await connectDB();

    const result = await DisplayEnergyData.deleteOne({
      userId,
      displayType,
    })
      .where({ userId })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Delete all display data for a user
   */
  async deleteAllForUser(userId: string): Promise<number> {
    await connectDB();

    const result = await DisplayEnergyData.deleteMany({
      userId,
    })
      .where({ userId })
      .exec();

    return result.deletedCount;
  }

  /**
   * Invalidate all display data for a user
   * Currently implements hard delete, but could be extended
   * to support soft-delete or marking for recalculation
   */
  async invalidateForUser(userId: string): Promise<number> {
    await connectDB();

    const result = await DisplayEnergyData.deleteMany({
      userId,
    })
      .where({ userId })
      .exec();
    
    return result.deletedCount;
  }
}
