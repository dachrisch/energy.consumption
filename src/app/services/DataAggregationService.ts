/**
 * Data Aggregation Service
 *
 * Pure functions for aggregating energy measurement data into histogram buckets.
 * Used by the timeline slider to visualize measurement distribution over time.
 *
 * Design Decision: Single color histogram (not split by Power/Gas)
 * - User requirement: "measurements in general is enough"
 * - Simpler, faster, sufficient for showing data density
 */

import { EnergyType } from '../types';

/**
 * Histogram bucket interface
 * Each bucket represents a time range and count of measurements in that range
 */
export interface HistogramBucket {
  startDate: Date;
  endDate: Date;
  count: number;
}

/**
 * Date range interface
 */
export interface DateRange {
  min: Date | null;
  max: Date | null;
}

/**
 * Get the minimum and maximum dates from a dataset
 *
 * @param data - Array of energy measurements
 * @returns Object with min and max dates (null if empty dataset)
 */
export function getDataDateRange(data: EnergyType[]): DateRange {
  if (data.length === 0) {
    return { min: null, max: null };
  }

  let min = new Date(data[0].date);
  let max = new Date(data[0].date);

  for (const item of data) {
    const date = new Date(item.date);
    if (date < min) min = date;
    if (date > max) max = date;
  }

  return { min, max };
}

/**
 * Calculate optimal bucket count based on container width
 *
 * @param containerWidth - Width of histogram container in pixels
 * @returns Number of buckets (20-30 for mobile, 60-100 for desktop)
 */
export function calculateBucketCount(containerWidth: number): number {
  const MIN_BUCKETS = 10;
  const MAX_BUCKETS = 100;

  // Mobile breakpoint: 640px
  if (containerWidth < 640) {
    // Mobile: 20-30 buckets
    // Scale from 20 (at 320px) to 30 (at 639px)
    const buckets = Math.floor(20 + ((containerWidth - 320) / (640 - 320)) * 10);
    return Math.max(MIN_BUCKETS, Math.min(30, buckets));
  }

  // Desktop: 60-100 buckets
  // Scale from 60 (at 640px) to 100 (at 1600px)
  const buckets = Math.floor(60 + ((containerWidth - 640) / (1600 - 640)) * 40);
  return Math.max(60, Math.min(MAX_BUCKETS, buckets));
}

/**
 * Create empty histogram buckets covering a date range
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param bucketCount - Number of buckets to create
 * @returns Array of empty histogram buckets
 */
export function createEmptyBuckets(
  startDate: Date,
  endDate: Date,
  bucketCount: number
): HistogramBucket[] {
  const buckets: HistogramBucket[] = [];

  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketDuration = totalMs / bucketCount;

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(startDate.getTime() + i * bucketDuration);
    const bucketEnd = new Date(startDate.getTime() + (i + 1) * bucketDuration);

    buckets.push({
      startDate: bucketStart,
      endDate: bucketEnd,
      count: 0,
    });
  }

  return buckets;
}

/**
 * Aggregate energy measurements into histogram buckets
 *
 * Single color aggregation: All measurements counted together (not split by type)
 * This provides a simple visualization of data density over time.
 *
 * @param data - Array of energy measurements
 * @param startDate - Start of histogram range
 * @param endDate - End of histogram range
 * @param bucketCount - Number of buckets
 * @returns Array of histogram buckets with counts
 */
export function aggregateDataIntoBuckets(
  data: EnergyType[],
  startDate: Date,
  endDate: Date,
  bucketCount: number
): HistogramBucket[] {
  // Create empty buckets
  const buckets = createEmptyBuckets(startDate, endDate, bucketCount);

  if (data.length === 0) {
    return buckets;
  }

  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketDuration = totalMs / bucketCount;

  // Aggregate data into buckets
  for (const measurement of data) {
    const measurementTime = new Date(measurement.date).getTime();
    const startTime = startDate.getTime();

    // Skip measurements outside the range
    if (measurementTime < startTime || measurementTime > endDate.getTime()) {
      continue;
    }

    // Calculate which bucket this measurement belongs to
    const bucketIndex = Math.floor((measurementTime - startTime) / bucketDuration);

    // Clamp to valid bucket range (handle edge cases)
    const clampedIndex = Math.max(0, Math.min(bucketCount - 1, bucketIndex));

    // Increment count (single color - all measurements counted together)
    buckets[clampedIndex].count += 1;
  }

  return buckets;
}

/**
 * Get maximum count across all buckets
 * Used for scaling histogram bars
 *
 * @param buckets - Array of histogram buckets
 * @returns Maximum count value
 */
export function getMaxBucketCount(buckets: HistogramBucket[]): number {
  if (buckets.length === 0) return 0;

  return Math.max(...buckets.map((b) => b.count));
}

/**
 * Check if dataset is empty or has no measurements
 *
 * @param data - Array of energy measurements
 * @returns True if dataset is empty
 */
export function isDatasetEmpty(data: EnergyType[]): boolean {
  return data.length === 0;
}
