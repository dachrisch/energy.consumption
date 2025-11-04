/**
 * DateRangeDisplay Component
 *
 * Displays formatted date labels below slider handles.
 *
 * Design Specifications:
 * - Desktop (≥640px): Full date format (MMMM D, YYYY), 14px font
 * - Mobile (<640px): Short format (MM/DD), 12px font
 * - Position: 8px below handle center (desktop), 6px (mobile)
 * - Collision handling: Hide labels if they overlap
 */

'use client';

import React, { memo, useMemo } from 'react';
import { DateRangeDisplayProps, DateFormat } from './types';

const MIN_LABEL_GAP = 40; // Minimum gap between labels to prevent overlap
const LABEL_PADDING = 10; // Padding from container edge

const DateRangeDisplay: React.FC<DateRangeDisplayProps> = memo(
  ({
    startDate,
    endDate,
    startPosition,
    endPosition,
    format,
    containerWidth,
    className = '',
  }) => {
    // Format date based on display format
    const formatDate = (date: Date, dateFormat: DateFormat): string => {
      if (dateFormat === 'full') {
        // Desktop: "October 1, 2024"
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else {
        // Mobile: "10/01"
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
      }
    };

    // Format dates
    const formattedStartDate = useMemo(() => formatDate(startDate, format), [startDate, format]);
    const formattedEndDate = useMemo(() => formatDate(endDate, format), [endDate, format]);

    // Estimate label width based on format
    const labelEstimatedWidth = useMemo(() => {
      return format === 'full' ? 120 : 40;
    }, [format]);

    // Check if labels will overlap (simple heuristic)
    const labelsOverlap = useMemo(() => {
      const gap = endPosition - startPosition;
      return gap < MIN_LABEL_GAP;
    }, [startPosition, endPosition]);

    // Edge detection for start label
    const isStartNearLeftEdge = useMemo(() => {
      return startPosition < labelEstimatedWidth / 2 + LABEL_PADDING;
    }, [startPosition, labelEstimatedWidth]);

    // Edge detection for end label
    const isEndNearRightEdge = useMemo(() => {
      return endPosition > containerWidth - labelEstimatedWidth / 2 - LABEL_PADDING;
    }, [endPosition, containerWidth, labelEstimatedWidth]);

    // Font size based on format
    const fontSize = format === 'full' ? '0.875rem' : '0.75rem'; // 14px : 12px
    const marginTop = format === 'full' ? '8px' : '6px';

    // Calculate label styles with edge detection
    const startLabelStyle = useMemo(() => {
      const baseStyle = {
        fontSize,
        marginTop,
      };

      if (isStartNearLeftEdge) {
        // Align left
        return {
          ...baseStyle,
          left: `${LABEL_PADDING}px`,
          transform: 'none',
        };
      } else {
        // Center align (default)
        return {
          ...baseStyle,
          left: `${startPosition}px`,
          transform: 'translateX(-50%)',
        };
      }
    }, [startPosition, isStartNearLeftEdge, fontSize, marginTop]);

    const endLabelStyle = useMemo(() => {
      const baseStyle = {
        fontSize,
        marginTop,
      };

      if (isEndNearRightEdge) {
        // Align right
        return {
          ...baseStyle,
          right: `${LABEL_PADDING}px`,
          left: 'auto',
          transform: 'none',
        };
      } else {
        // Center align (default)
        return {
          ...baseStyle,
          left: `${endPosition}px`,
          transform: 'translateX(-50%)',
        };
      }
    }, [endPosition, isEndNearRightEdge, fontSize, marginTop]);

    // If labels overlap, show only start label
    if (labelsOverlap) {
      return (
        <div className={`relative ${className}`}>
          <div
            className="absolute text-foreground-muted font-medium whitespace-nowrap"
            style={startLabelStyle}
          >
            {formattedStartDate}
          </div>
        </div>
      );
    }

    // Normal display: both labels
    return (
      <div className={`relative ${className}`}>
        {/* Start date label */}
        <div
          className="absolute text-foreground-muted font-medium whitespace-nowrap"
          style={startLabelStyle}
        >
          {formattedStartDate}
        </div>

        {/* End date label */}
        <div
          className="absolute text-foreground-muted font-medium whitespace-nowrap"
          style={endLabelStyle}
        >
          {formattedEndDate}
        </div>

        {/* Screen reader only: full date range */}
        <span className="sr-only">
          Selected date range: {formattedStartDate} to {formattedEndDate}
        </span>
      </div>
    );
  }
);

DateRangeDisplay.displayName = 'DateRangeDisplay';

export default DateRangeDisplay;
