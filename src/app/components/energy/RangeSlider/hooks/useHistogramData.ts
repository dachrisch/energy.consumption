/**
 * useHistogramData Hook
 *
 * Prepares histogram data from energy measurements with memoization.
 * Aggregates data into buckets for visualization.
 *
 * Performance: Memoized to prevent unnecessary recalculations
 */

import { useMemo } from 'react';
import { EnergyType } from '@/app/types';
import {
  aggregateDataIntoBuckets,
  calculateBucketCount,
  getMaxBucketCount,
  isDatasetEmpty,
} from '@/app/services/DataAggregationService';
import { HistogramData } from '../types';

interface UseHistogramDataParams {
  data: EnergyType[];
  startDate: Date;
  endDate: Date;
  containerWidth: number;
}

/**
 * Custom hook to prepare histogram data
 *
 * @param params - Data, date range, and container width
 * @returns Histogram data ready for visualization
 */
export function useHistogramData({
  data,
  startDate,
  endDate,
  containerWidth,
}: UseHistogramDataParams): HistogramData {
  return useMemo(() => {
    // Check if dataset is empty
    if (isDatasetEmpty(data)) {
      return {
        buckets: [],
        maxCount: 0,
        isEmpty: true,
      };
    }

    // Calculate optimal bucket count based on container width
    const bucketCount = calculateBucketCount(containerWidth);

    // Aggregate data into buckets
    const buckets = aggregateDataIntoBuckets(data, startDate, endDate, bucketCount);

    // Get maximum count for scaling
    const maxCount = getMaxBucketCount(buckets);

    return {
      buckets,
      maxCount,
      isEmpty: false,
    };
  }, [data, startDate, endDate, containerWidth]);
}
