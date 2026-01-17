/**
 * RangeSlider Component
 *
 * Main container component orchestrating all sub-components.
 * Provides interactive timeline slider with data visualization.
 *
 * Features:
 * - Dual-handle range selection
 * - Histogram visualization
 * - Mouse/touch drag support
 * - Keyboard navigation
 * - Preset animations
 * - Responsive sizing
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import SliderVisualization from './SliderVisualization';
import AccessibleRangeSlider from './AccessibleRangeSlider';
import DateRangeDisplay from './DateRangeDisplay';
import { useHistogramData } from './hooks/useHistogramData';
import { RangeSliderProps, DateFormat } from './types';
import {
  dateToPercentage,
  percentageToDate,
} from '@/app/services/SliderCalculationService';

// Desktop breakpoint (640px)
const DESKTOP_BREAKPOINT = 640;

const RangeSlider: React.FC<RangeSliderProps> = ({
  data,
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
  className = '',
  disabled = false,
}) => {
  // Container ref for sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Histogram data
  const histogramData = useHistogramData({
    data,
    startDate: minDate,
    endDate: maxDate,
    containerWidth,
  });

  // Update container width on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
        setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Map dates to 0-100 values for Radix Slider
  const sliderValue = useMemo((): [number, number] => {
    return [
      dateToPercentage(dateRange.start, minDate, maxDate),
      dateToPercentage(dateRange.end, minDate, maxDate),
    ];
  }, [dateRange, minDate, maxDate]);

  // Handle slider value change
  const handleSliderChange = useCallback((values: [number, number]) => {
    const newStart = percentageToDate(values[0], minDate, maxDate);
    const newEnd = percentageToDate(values[1], minDate, maxDate);
    
    onDateRangeChange({ start: newStart, end: newEnd });
  }, [minDate, maxDate, onDateRangeChange]);

  // Date format based on screen size
  const dateFormat: DateFormat = isMobile ? 'short' : 'full';

  // Histogram height
  const histogramHeight = isMobile ? 100 : 120;
  // Reduced height since Radix slider is more compact than custom handles
  const totalHeight = histogramHeight + 80; 

  // Disabled state
  if (disabled || histogramData.isEmpty) {
    return (
      <div className={`relative ${className}`} style={{ height: totalHeight }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-foreground-muted">
            {disabled ? 'Slider disabled' : 'No measurements available'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate pixel positions for DateRangeDisplay (needed for label positioning)
  const startPosition = (sliderValue[0] / 100) * containerWidth;
  const endPosition = (sliderValue[1] / 100) * containerWidth;

  return (
    <div
      ref={containerRef}
      className={`relative ${className} flex flex-col`}
      style={{ height: totalHeight }}
      data-slider-container
    >
      {/* Histogram visualization */}
      <div className="mb-2">
        <SliderVisualization
          histogramData={histogramData}
          width={containerWidth}
          height={histogramHeight}
        />
      </div>

      {/* Radix UI Slider */}
      <div className="px-2">
        <AccessibleRangeSlider
          min={0}
          max={100}
          step={0.1} // Fine-grained control
          value={sliderValue}
          onChange={handleSliderChange}
        />
      </div>

      {/* Date labels */}
      <div className="mt-2">
        <DateRangeDisplay
          startDate={dateRange.start}
          endDate={dateRange.end}
          startPosition={startPosition}
          endPosition={endPosition}
          format={dateFormat}
          containerWidth={containerWidth}
        />
      </div>

      {/* Live region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Selected range: {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}
      </div>
    </div>
  );
};

export default RangeSlider;

export default RangeSlider;
