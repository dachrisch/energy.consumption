/**
 * MongoDB Energy Repository Implementation
 *
 * Concrete implementation of IEnergyRepository using Mongoose.
 * Provides data access layer for source energy readings.
 *
 * Features:
 * - User data isolation enforced on all queries
 * - Efficient querying with filters, sorting, and pagination
 * - Error propagation for proper error handling
 * - SOLID principles: Single responsibility, dependency inversion
 */

import { IEnergyRepository } from '../interfaces/IEnergyRepository';
import { EnergyFilters, EnergyOptions, SourceEnergyReading } from '@/app/types';
import { connectDB } from '@/lib/mongodb';
import { SourceEnergyReadingModel } from '@/models/SourceEnergyReading';

export class MongoEnergyRepository implements IEnergyRepository {
  /**
   * Create a new energy reading
   */
  async create(
    reading: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<SourceEnergyReading> {
    await connectDB();
    const newReading = new SourceEnergyReadingModel(reading);
    return await newReading.save();
  }

  /**
   * Create multiple energy readings in bulk
   */
  async createMany(
    readings: Omit<SourceEnergyReading, '_id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<SourceEnergyReading[]> {
    await connectDB();
    return await SourceEnergyReadingModel.insertMany(readings);
  }

  /**
   * Find a single reading by ID with user isolation
   */
  async findById(id: string, userId: string): Promise<SourceEnergyReading | null> {
    await connectDB();
    return await SourceEnergyReadingModel.findById(id)
      .where({ userId })
      .exec();
  }

  /**
   * Find all readings for a user with optional filters
   */
  async findAll(userId: string, filters?: EnergyFilters): Promise<SourceEnergyReading[]> {
    await connectDB();

    // Build query conditions
    const conditions: Record<string, unknown> = { userId };

    // Apply type filter
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        conditions.type = { $in: filters.type };
      } else {
        conditions.type = filters.type;
      }
    }

    // Apply date range filter
    if (filters?.dateRange) {
      conditions.date = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end,
      };
    }

    // Build query
    let query = SourceEnergyReadingModel.find().where(conditions);

    // Apply pagination
    if (filters?.offset !== undefined) {
      query = query.skip(filters.offset);
    }
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit);
    }

    // Apply sorting
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      query = query.sort({ [filters.sortBy]: sortOrder });
    }

    return await query.exec();
  }

  /**
   * Find readings within a date range
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: EnergyOptions
  ): Promise<SourceEnergyReading[]> {
    await connectDB();

    const conditions: Record<string, unknown> = {
      userId,
      date: { $gte: startDate, $lte: endDate },
    };

    if (type) {
      conditions.type = type;
    }

    return await SourceEnergyReadingModel.find()
      .where(conditions)
      .sort({ date: 1 })
      .exec();
  }

  /**
   * Update an existing reading with user isolation
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<SourceEnergyReading, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SourceEnergyReading | null> {
    await connectDB();

    return await SourceEnergyReadingModel.findOneAndUpdate(
      { _id: id },
      data,
      { new: true }
    )
      .where({ userId })
      .exec();
  }

  /**
   * Delete a single reading with user isolation
   */
  async delete(id: string, userId: string): Promise<boolean> {
    await connectDB();

    const result = await SourceEnergyReadingModel.deleteOne({ _id: id })
      .where({ userId })
      .exec();

    return result.deletedCount > 0;
  }

  /**
   * Delete multiple readings with user isolation
   */
  async deleteMany(ids: string[], userId: string): Promise<number> {
    await connectDB();

    const result = await SourceEnergyReadingModel.deleteMany({
      _id: { $in: ids },
    })
      .where({ userId })
      .exec();

    return result.deletedCount;
  }

  /**
   * Count readings matching filters
   */
  async count(userId: string, filters?: EnergyFilters): Promise<number> {
    await connectDB();

    // Build query conditions
    const conditions: Record<string, unknown> = { userId };

    // Apply type filter
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        conditions.type = { $in: filters.type };
      } else {
        conditions.type = filters.type;
      }
    }

    // Apply date range filter
    if (filters?.dateRange) {
      conditions.date = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end,
      };
    }

    return await SourceEnergyReadingModel.countDocuments()
      .where(conditions)
      .exec();
  }

  /**
   * Get minimum and maximum dates for readings
   */
  async getMinMaxDates(
    userId: string,
    type?: EnergyOptions
  ): Promise<{ min: Date; max: Date } | null> {
    await connectDB();

    const conditions: Record<string, unknown> = { userId };
    if (type) {
      conditions.type = type;
    }

    // Find earliest reading
    const minReading = await SourceEnergyReadingModel.findOne()
      .where(conditions)
      .sort({ date: 1 })
      .exec();

    // Find latest reading
    const maxReading = await SourceEnergyReadingModel.findOne()
      .where(conditions)
      .sort({ date: -1 })
      .exec();

    if (!minReading || !maxReading) {
      return null;
    }

    return {
      min: minReading.date,
      max: maxReading.date,
    };
  }
}
