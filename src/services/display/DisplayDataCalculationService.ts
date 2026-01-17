/**
 * Display Data Calculation Service
 *
 * Service for calculating and caching pre-computed display data:
 * - Monthly chart data (meter readings)
 * - Histogram data (timeline slider)
 *
 * Design principles:
 * - SRP: Single responsibility - calculate and cache display data
 * - DIP: Depends on abstractions (repositories, aggregation services)
 * - OCP: Easy to add new display data types
 *
 * Calculation strategy:
 * - Fetch source readings from energy repository
 * - Use existing aggregation services (MonthlyDataAggregationService, DataAggregationService)
 * - Generate hash of source data for cache validation
 * - Track metadata (reading count, calculation time)
 * - Upsert to display data repository
 *
 * Hash generation:
 * - Creates SHA256 hash from reading IDs and dates
 * - Sorted for consistency
 * - Used to validate if cached data is still valid
 */

import { createHash } from 'crypto';
import { IEnergyRepository } from '@/repositories/interfaces/IEnergyRepository';
import { IDisplayDataRepository } from '@/repositories/interfaces/IDisplayDataRepository';
import { DisplayEnergyData, DisplayDataType, SourceEnergyReading, EnergyOptions } from '@/app/types';
import { calculateMonthlyReadings } from '@/app/services/MonthlyDataAggregationService';
import { aggregateDataIntoBuckets } from '@/app/services/DataAggregationService';

export class DisplayDataCalculationService {
  constructor(
    private energyRepository: IEnergyRepository,
    private displayRepository: IDisplayDataRepository
  ) {}

  /**
   * Calculate and store monthly chart data for a user
   *
   * Algorithm:
   * 1. Fetch all readings for the year
   * 2. Calculate monthly data using MonthlyDataAggregationService
   * 3. Generate hash of source data
   * 4. Track metadata (reading count, calculation time)
   * 5. Upsert to display data repository
   *
   * @param userId - User ID (for data isolation)
   * @param year - Year to calculate (e.g., 2024)
   * @param type - Energy type (power or gas)
   * @returns Upserted display data
   */
  async calculateMonthlyChartData(
    userId: string,
    type: EnergyOptions,
    year: number
  ): Promise<DisplayEnergyData> {
    const startTime = Date.now();

    // Validate year
    if (isNaN(year) || year < 1900 || year > 2100) {
      year = new Date().getFullYear();
    }

    // Fetch all readings for the year
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31, 23:59:59
    const readings = await this.energyRepository.findByDateRange(
      userId,
      startDate,
      endDate,
      type
    );

    // Artificial delay to simulate expensive calculation (for cache demonstration in tests)
    if (process.env.NODE_ENV === 'test' && process.env.SIMULATE_SLOW_CALCULATION === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate monthly data using existing service
    const monthlyData = calculateMonthlyReadings(readings, year, type);

    // Generate hash of source data
    const sourceDataHash = this.generateDataHash(readings);

    // Prepare display data
    const displayType: DisplayDataType = `monthly-chart-${type}`;
    const displayData: Omit<DisplayEnergyData, '_id'> = {
      userId,
      displayType,
      data: monthlyData,
      calculatedAt: new Date(),
      sourceDataHash,
      metadata: {
        sourceReadingCount: readings.length,
        calculationTimeMs: Date.now() - startTime,
        filters: { year, type },
      },
    };

    // Upsert (insert or update)
    return this.displayRepository.upsert(displayData);
  }

  /**
   * Calculate and store histogram data for timeline slider
   *
   * Algorithm:
   * 1. Fetch readings for date range
   * 2. Calculate histogram using DataAggregationService
   * 3. Generate hash of source data
   * 4. Track metadata
   * 5. Upsert to display data repository
   *
   * @param userId - User ID (for data isolation)
   * @param type - Energy type (power or gas)
   * @param startDate - Range start
   * @param endDate - Range end
   * @param bucketCount - Number of histogram buckets (default: 60)
   * @returns Upserted display data
   */
  async calculateHistogramData(
    userId: string,
    type: EnergyOptions,
    startDate: Date = new Date(0),
    endDate: Date = new Date(),
    bucketCount: number = 60
  ): Promise<DisplayEnergyData> {
    const startTime = Date.now();

    // Ensure they are Date objects
    const sDate = startDate instanceof Date ? startDate : new Date(startDate);
    const eDate = endDate instanceof Date ? endDate : new Date(endDate);

    // Fetch readings for date range
    const readings = await this.energyRepository.findByDateRange(
      userId,
      sDate,
      eDate,
      type
    );

    // Calculate histogram using existing service
    const histogramData = aggregateDataIntoBuckets(readings, sDate, eDate, bucketCount);

    // Generate hash of source data
    const sourceDataHash = this.generateDataHash(readings);

    // Prepare display data
    const displayType: DisplayDataType = `histogram-${type}`;
    const displayData: Omit<DisplayEnergyData, '_id'> = {
      userId,
      displayType,
      data: histogramData,
      calculatedAt: new Date(),
      sourceDataHash,
      metadata: {
        sourceReadingCount: readings.length,
        calculationTimeMs: Date.now() - startTime,
        filters: { type, startDate: sDate, endDate: eDate, bucketCount },
      },
    };

    return this.displayRepository.upsert(displayData);
  }

  /**
   * Invalidate all display data for a user (force recalculation)
   *
   * Called by event handlers when source data changes.
   * Simple strategy for Phase 1: invalidate ALL display data on ANY change.
   * Can be optimized in later phases to invalidate only affected data.
   *
   * @param userId - User ID (for data isolation)
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    await this.displayRepository.invalidateForUser(userId);
  }

  /**
   * Get cached display data (Phase 2: Frontend Adapter)
   *
   * Retrieves pre-calculated display data from cache.
   * Returns null if no cached data exists (caller should calculate on-demand).
   *
   * @param userId - User ID (for data isolation)
   * @param displayType - Type of display data to retrieve
   * @param filters - Optional filters to match cached data
   * @returns Cached display data or null
   */
  async getDisplayData(
    userId: string,
    displayType: DisplayDataType,
    filters?: Record<string, unknown>
  ): Promise<DisplayEnergyData | null> {
    return await this.displayRepository.findByTypeAndFilters(
      userId,
      displayType,
      filters || {}
    );
  }

  /**
   * Calculate display data on-demand (Phase 2: Frontend Adapter)
   *
   * Calculates display data if not cached, then stores in cache.
   * Used when getDisplayData() returns null (cache miss).
   *
   * @param userId - User ID (for data isolation)
   * @param displayType - Type of display data to calculate
   * @param filters - Filters for calculation (year, type, date range, etc.)
   * @returns Calculated and cached display data
   */
  async calculateDisplayData(
    userId: string,
    displayType: DisplayDataType,
    filters?: Record<string, unknown>
  ): Promise<DisplayEnergyData> {
    // Route to appropriate calculation method based on display type
    if (displayType.startsWith('monthly-chart')) {
      const type = (displayType.split('-')[2] || filters?.type || 'power') as EnergyOptions;
      let year = Number(filters?.year);
      if (isNaN(year) || year < 1900 || year > 2100) {
        year = new Date().getFullYear();
      }
      return await this.calculateMonthlyChartData(userId, type, year);
    } else if (displayType.startsWith('histogram')) {
      const type = (displayType.split('-')[1] || filters?.type || 'power') as EnergyOptions;
      const startDate = (filters?.startDate as Date) || new Date();
      const endDate = (filters?.endDate as Date) || new Date();
      const bucketCount = (filters?.bucketCount as number) || 60;
      return await this.calculateHistogramData(
        userId,
        type,
        startDate,
        endDate,
        bucketCount
      );
    } else {
      throw new Error(`Unsupported display type: ${displayType}`);
    }
  }

  /**
   * Generate hash of source data for cache validation
   *
   * Creates SHA256 hash from:
   * - Reading IDs (identifies which readings were used)
   * - Reading dates (identifies when they were taken)
   * - Sorted for consistency
   *
   * @param readings - Source energy readings
   * @returns SHA256 hash (64 character hex string)
   */
  private generateDataHash(readings: SourceEnergyReading[]): string {
    // Create hash from reading IDs + dates (indicates source data version)
    const data = readings
      .map((r) => `${r._id}-${r.date.toISOString()}`)
      .sort()
      .join('|');

    return createHash('sha256').update(data).digest('hex');
  }
}
