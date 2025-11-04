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
 * Slider handle type
 */
export type HandleType = 'start' | 'end';

/**
 * Slider state for internal component management
 */
export interface SliderState {
  isDragging: boolean;
  activeHandle: HandleType | null;
  isAnimating: boolean;
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
 * SliderTrack component props
 */
export interface SliderTrackProps {
  /** Start position in pixels (0 to width) */
  startPosition: number;

  /** End position in pixels (0 to width) */
  endPosition: number;

  /** Total width of track */
  width: number;

  /** Optional class name */
  className?: string;
}

/**
 * SliderHandle component props
 */
export interface SliderHandleProps {
  /** Handle type (start or end) */
  type: HandleType;

  /** Current position in pixels */
  position: number;

  /** Current date value */
  date: Date;

  /** Is this handle being dragged? */
  isDragging: boolean;

  /** Is this handle focused? */
  isFocused: boolean;

  /** Callback when drag starts */
  onDragStart: (type: HandleType) => void;

  /** Callback during drag */
  onDrag: (position: number) => void;

  /** Callback when drag ends */
  onDragEnd: () => void;

  /** Callback for keyboard navigation */
  onKeyDown: (event: React.KeyboardEvent, type: HandleType) => void;

  /** Callback when handle gains focus */
  onFocus: () => void;

  /** Callback when handle loses focus */
  onBlur: () => void;

  /** Minimum allowed position */
  minPosition: number;

  /** Maximum allowed position */
  maxPosition: number;

  /** Container width for calculations */
  containerWidth: number;

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

  /** Optional class name */
  className?: string;
}

/**
 * Drag event data
 */
export interface DragEventData {
  startX: number;
  currentX: number;
  deltaX: number;
}

/**
 * Animation config
 */
export interface AnimationConfig {
  duration: number; // milliseconds
  easing: string; // CSS easing function
}
