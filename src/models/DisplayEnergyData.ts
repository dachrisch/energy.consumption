/**
 * DisplayEnergyData Model
 *
 * Mongoose model for pre-calculated display data.
 * This model stores cached, computed data derived from source readings.
 *
 * Features:
 * - User data isolation via applyPreFilter middleware
 * - Composite unique index (userId + displayType) for upsert operations
 * - Flexible data field to accommodate different display types
 * - Metadata for cache invalidation and debugging
 */

import mongoose, { Schema } from 'mongoose';
import { DisplayEnergyData } from '@/app/types';
import { applyPreFilter } from './sessionFilter';

const DisplayEnergyDataSchema = new Schema<DisplayEnergyData>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    displayType: {
      type: String,
      required: true,
      enum: [
        'monthly-chart-power',
        'monthly-chart-gas',
        'histogram-power',
        'histogram-gas',
        'table-data',
      ],
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    calculatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sourceDataHash: {
      type: String,
      required: true,
    },
    metadata: {
      sourceReadingCount: Number,
      calculationTimeMs: Number,
      filters: Schema.Types.Mixed,
    },
  },
  {
    collection: 'display_energy_data',
  }
);

// Composite unique index for upsert operations
// One display data record per user per display type
DisplayEnergyDataSchema.index({ userId: 1, displayType: 1 }, { unique: true });

// Apply user data isolation middleware
applyPreFilter(DisplayEnergyDataSchema);

// Export model (handle Next.js hot reload)
export const DisplayEnergyDataModel =
  mongoose.models.DisplayEnergyData ||
  mongoose.model<DisplayEnergyData>('DisplayEnergyData', DisplayEnergyDataSchema);
