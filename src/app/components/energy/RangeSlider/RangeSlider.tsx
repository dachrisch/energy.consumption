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
import SliderTrack from './SliderTrack';
import SliderHandle from './SliderHandle';
import DateRangeDisplay from './DateRangeDisplay';
import { useHistogramData } from './hooks/useHistogramData';
import { useSliderKeyboard } from './hooks/useSliderKeyboard';
import { RangeSliderProps, HandleType, SliderState, DateFormat } from './types';
import {
  dateToPosition,
  positionToDate,
  clampDate,
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

  // Slider state
  const [sliderState, setSliderState] = useState<SliderState>({
    isDragging: false,
    activeHandle: null,
    isAnimating: false,
  });

  // Track focused handle for keyboard navigation
  const [focusedHandle, setFocusedHandle] = useState<HandleType | null>(null);

  // Debounce timer for filter application
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Initial size
    updateSize();

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Window resize for mobile/desktop detection
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Calculate handle positions from dates
  const startPosition = useMemo(() => {
    return dateToPosition(dateRange.start, minDate, maxDate, containerWidth);
  }, [dateRange.start, minDate, maxDate, containerWidth]);

  const endPosition = useMemo(() => {
    return dateToPosition(dateRange.end, minDate, maxDate, containerWidth);
  }, [dateRange.end, minDate, maxDate, containerWidth]);

  // Handle date change from keyboard navigation
  const handleDateChange = useCallback(
    (type: HandleType, newDate: Date) => {
      const clampedDate = clampDate(newDate, minDate, maxDate);

      const newRange = {
        start: type === 'start' ? clampedDate : dateRange.start,
        end: type === 'end' ? clampedDate : dateRange.end,
      };

      // Immediate update (no debounce for keyboard)
      onDateRangeChange(newRange);
    },
    [dateRange, minDate, maxDate, onDateRangeChange]
  );

  // Keyboard navigation hook
  const { handleKeyDown } = useSliderKeyboard({
    minDate,
    maxDate,
    startDate: dateRange.start,
    endDate: dateRange.end,
    onDateChange: handleDateChange,
  });

  // Handle drag start
  const handleDragStart = useCallback((type: HandleType) => {
    setSliderState((prev) => ({
      ...prev,
      isDragging: true,
      activeHandle: type,
    }));
  }, []);

  // Handle drag (position change)
  const handleDrag = useCallback(
    (position: number) => {
      if (!sliderState.activeHandle) return;

      const newDate = positionToDate(position, minDate, maxDate, containerWidth);
      const clampedDate = clampDate(newDate, minDate, maxDate);

      // Prevent handles from crossing
      let finalDate = clampedDate;
      if (sliderState.activeHandle === 'start' && clampedDate > dateRange.end) {
        finalDate = dateRange.end;
      } else if (sliderState.activeHandle === 'end' && clampedDate < dateRange.start) {
        finalDate = dateRange.start;
      }

      // Update immediately for visual feedback (debounced callback below)
      const newRange = {
        start: sliderState.activeHandle === 'start' ? finalDate : dateRange.start,
        end: sliderState.activeHandle === 'end' ? finalDate : dateRange.end,
      };

      // Optimistic update for smooth dragging
      onDateRangeChange(newRange);
    },
    [sliderState.activeHandle, minDate, maxDate, containerWidth, dateRange, onDateRangeChange]
  );

  // Handle drag end (debounced filter application)
  const handleDragEnd = useCallback(() => {
    setSliderState((prev) => ({
      ...prev,
      isDragging: false,
      activeHandle: null,
    }));

    // Debounce filter application (200ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Filter already applied via optimistic update
      // This timeout is for any additional processing if needed
    }, 200);
  }, []);

  // Global drag event listeners (CRITICAL FIX: FR-V3.1-001)
  useEffect(() => {
    if (!sliderState.isDragging) return;

    // Global mouse/touch move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const position = e.clientX - rect.left;
      handleDrag(position);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      e.preventDefault(); // Prevent page scroll
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const position = touch.clientX - rect.left;
      handleDrag(position);
    };

    // Global mouse/touch up handler
    const handleMouseUp = () => {
      handleDragEnd();
    };

    // Attach global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [sliderState.isDragging, handleDrag, handleDragEnd]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle focus events
  const handleFocus = useCallback((type: HandleType) => {
    setFocusedHandle(type);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedHandle(null);
  }, []);

  // Date format based on screen size
  const dateFormat: DateFormat = isMobile ? 'short' : 'full';

  // Histogram height
  const histogramHeight = isMobile ? 100 : 120;
  const totalHeight = histogramHeight + 60; // histogram + labels space

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

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight }}
      data-slider-container
    >
      {/* Histogram visualization */}
      <div className="mb-4">
        <SliderVisualization
          histogramData={histogramData}
          width={containerWidth}
          height={histogramHeight}
        />
      </div>

      {/* Slider track and handles */}
      <div className="relative" style={{ height: 40 }}>
        {/* Track */}
        <SliderTrack
          startPosition={startPosition}
          endPosition={endPosition}
          width={containerWidth}
        />

        {/* Start handle */}
        <SliderHandle
          type="start"
          position={startPosition}
          date={dateRange.start}
          isDragging={sliderState.isDragging && sliderState.activeHandle === 'start'}
          isFocused={focusedHandle === 'start'}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onKeyDown={(e, type) => {
            handleKeyDown(e, type);
          }}
          onFocus={() => handleFocus('start')}
          onBlur={handleBlur}
          minPosition={0}
          maxPosition={endPosition}
          containerWidth={containerWidth}
        />

        {/* End handle */}
        <SliderHandle
          type="end"
          position={endPosition}
          date={dateRange.end}
          isDragging={sliderState.isDragging && sliderState.activeHandle === 'end'}
          isFocused={focusedHandle === 'end'}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onKeyDown={(e, type) => {
            handleKeyDown(e, type);
          }}
          onFocus={() => handleFocus('end')}
          onBlur={handleBlur}
          minPosition={startPosition}
          maxPosition={containerWidth}
          containerWidth={containerWidth}
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
        {sliderState.isDragging
          ? `Adjusting ${sliderState.activeHandle} date`
          : `Selected range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`}
      </div>
    </div>
  );
};

export default RangeSlider;
