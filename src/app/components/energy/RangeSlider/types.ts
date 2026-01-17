/**
 * Type definitions for RangeSlider components
 */

import { EnergyType } from '@/app/types';
import { HistogramBucket } from '@/app/services/DataAggregationService';

/**
 * Date range selection
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Histogram data prepared for visualization
 */
export interface HistogramData {
  buckets: HistogramBucket[];
  maxCount: number;
  isEmpty: boolean;
}

/**
 * RangeSlider component props
 */
export interface RangeSliderProps {
  /** Energy measurement data for histogram visualization */
  data: EnergyType[];

  /** Current selected date range */
  dateRange: DateRange;

  /** Callback when date range changes (debounced) */
  onDateRangeChange: (range: DateRange) => void;

  /** Minimum date (from data or preset) */
  minDate: Date;

  /** Maximum date (from data or preset) */
  maxDate: Date;

  /** Optional class name for styling */
  className?: string;

  /** Is slider disabled? */
  disabled?: boolean;
}

/**
 * SliderVisualization component props
 */
export interface SliderVisualizationProps {
  /** Histogram data to visualize */
  histogramData: HistogramData;

  /** Container width in pixels */
  width: number;

  /** Container height in pixels */
  height: number;

  /** Optional class name */
  className?: string;
}

/**
 * Date label display format
 */
export type DateFormat = 'full' | 'short';

/**
 * DateRangeDisplay component props
 */
export interface DateRangeDisplayProps {
  /** Start date */
  startDate: Date;

  /** End date */
  endDate: Date;

  /** Start handle position (for label positioning) */
  startPosition: number;

  /** End handle position (for label positioning) */
  endPosition: number;

  /** Display format (full for desktop, short for mobile) */
  format: DateFormat;

  /** Container width for edge detection */
  containerWidth: number;

  /** Optional class name */
  className?: string;
}