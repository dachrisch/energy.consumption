/**
 * SliderVisualization Component
 *
 * Renders histogram visualization of measurement distribution over time.
 * Single color bars (per user requirement: "measurements in general is enough")
 *
 * Design:
 * - SVG-based for scalability
 * - Primary color with transparency: rgba(124, 58, 237, 0.3)
 * - Responsive: fewer buckets on mobile, more on desktop
 * - Performance: Memoized to prevent unnecessary re-renders
 */

'use client';

import React, { memo } from 'react';
import { SliderVisualizationProps } from './types';

const SliderVisualization: React.FC<SliderVisualizationProps> = memo(
  ({ histogramData, width, height, className = '' }) => {
    const { buckets, maxCount, isEmpty } = histogramData;

    // Empty state
    if (isEmpty || buckets.length === 0) {
      return (
        <div
          className={`flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <p className="text-sm text-foreground-muted">No measurements available</p>
        </div>
      );
    }

    // Calculate bar dimensions
    const barWidth = width / buckets.length;
    const barGap = Math.max(1, barWidth * 0.1); // 10% gap between bars
    const actualBarWidth = barWidth - barGap;

    // Padding for chart (minimal - no y-axis labels)
    const paddingLeft = 5;
    const paddingRight = 5;
    const paddingTop = 10;
    const paddingBottom = 10;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Y-axis scale
    const yScale = maxCount > 0 ? chartHeight / maxCount : 0;

    return (
      <svg
        width={width}
        height={height}
        className={className}
        role="img"
        aria-label={`Histogram showing ${buckets.reduce((sum, b) => sum + b.count, 0)} total measurements`}
      >
        {/* Histogram bars */}
        {buckets.map((bucket, index) => {
          const barHeight = bucket.count * yScale;
          const x = paddingLeft + (index * chartWidth) / buckets.length + barGap / 2;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={`bar-${index}`}>
              {/* Single color bar */}
              <rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill="rgba(124, 58, 237, 0.3)"
                stroke="rgba(124, 58, 237, 0.6)"
                strokeWidth="1"
                className="transition-opacity hover:opacity-80"
              >
                <title>
                  {bucket.count} measurement{bucket.count !== 1 ? 's' : ''}
                  {'\n'}
                  {bucket.startDate.toLocaleDateString()} - {bucket.endDate.toLocaleDateString()}
                </title>
              </rect>
            </g>
          );
        })}

        {/* Hidden text for screen readers */}
        <text className="sr-only">
          Histogram showing measurement distribution from{' '}
          {buckets[0]?.startDate.toLocaleDateString()} to{' '}
          {buckets[buckets.length - 1]?.endDate.toLocaleDateString()}
        </text>
      </svg>
    );
  }
);

SliderVisualization.displayName = 'SliderVisualization';

export default SliderVisualization;
