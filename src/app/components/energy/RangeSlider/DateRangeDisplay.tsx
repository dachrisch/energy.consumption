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

const DateRangeDisplay: React.FC<DateRangeDisplayProps> = memo(
  ({
    startDate,
    endDate,
    startPosition,
    endPosition,
    format,
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

    // Check if labels will overlap (simple heuristic)
    const labelsOverlap = useMemo(() => {
      const gap = endPosition - startPosition;
      return gap < MIN_LABEL_GAP;
    }, [startPosition, endPosition]);

    // Font size based on format
    const fontSize = format === 'full' ? '0.875rem' : '0.75rem'; // 14px : 12px
    const marginTop = format === 'full' ? '8px' : '6px';

    // If labels overlap, show only start label
    if (labelsOverlap) {
      return (
        <div className={`relative ${className}`}>
          <div
            className="absolute text-foreground-muted font-medium text-center whitespace-nowrap"
            style={{
              left: `${startPosition}px`,
              transform: 'translateX(-50%)',
              fontSize,
              marginTop,
            }}
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
          className="absolute text-foreground-muted font-medium text-center whitespace-nowrap"
          style={{
            left: `${startPosition}px`,
            transform: 'translateX(-50%)',
            fontSize,
            marginTop,
          }}
        >
          {formattedStartDate}
        </div>

        {/* End date label */}
        <div
          className="absolute text-foreground-muted font-medium text-center whitespace-nowrap"
          style={{
            left: `${endPosition}px`,
            transform: 'translateX(-50%)',
            fontSize,
            marginTop,
          }}
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
