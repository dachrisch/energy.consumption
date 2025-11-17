/**
 * SourceEnergyReading Model
 *
 * Mongoose model for source energy readings - the single source of truth for energy data.
 * This model represents raw meter readings stored directly from user input or CSV import.
 *
 * Features:
 * - User data isolation via applyPreFilter middleware
 * - Automatic timestamps (createdAt, updatedAt)
 * - Optimized indexes for common queries
 */

import mongoose, { Schema } from 'mongoose';
import { SourceEnergyReading } from '@/app/types';
import { applyPreFilter } from './sessionFilter';

const SourceEnergyReadingSchema = new Schema<SourceEnergyReading>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['power', 'gas'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'source_energy_readings',
  }
);

// Compound indexes for query optimization
SourceEnergyReadingSchema.index({ userId: 1, date: 1 });
SourceEnergyReadingSchema.index({ userId: 1, type: 1, date: 1 });

// Apply user data isolation middleware
applyPreFilter(SourceEnergyReadingSchema);

// Export model (handle Next.js hot reload)
export const SourceEnergyReadingModel =
  mongoose.models.SourceEnergyReading ||
  mongoose.model<SourceEnergyReading>('SourceEnergyReading', SourceEnergyReadingSchema);
