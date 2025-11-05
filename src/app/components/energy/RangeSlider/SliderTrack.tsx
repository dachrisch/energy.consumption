/**
 * SliderTrack Component
 *
 * Renders the slider track with visual distinction between:
 * - Unselected ranges (before start handle, after end handle)
 * - Selected range (between handles)
 *
 * Design Specifications:
 * - Unselected: 4px height, border color
 * - Selected: 6px height, primary color, shadow
 * - Layered on top of histogram at y=110px
 * - z-index: 2 (above histogram, below handles)
 */

'use client';

import React, { memo } from 'react';
import { SliderTrackProps } from './types';

const SliderTrack: React.FC<SliderTrackProps> = memo(
  ({ startPosition, endPosition, width, className = '' }) => {
    // Track dimensions
    const trackHeight = 4; // Unselected track height
    const selectedTrackHeight = 6; // Selected range height

    // Calculate range widths
    const beforeStartWidth = startPosition;
    const selectedWidth = endPosition - startPosition;
    const afterEndWidth = width - endPosition;

    return (
      <div
        className={`relative ${className}`}
        style={{ width, height: selectedTrackHeight }}
        role="presentation"
      >
        {/* Unselected range: Before start handle */}
        {beforeStartWidth > 0 && (
          <div
            className="absolute bg-border rounded-sm"
            style={{
              left: 0,
              top: (selectedTrackHeight - trackHeight) / 2,
              width: beforeStartWidth,
              height: trackHeight,
              zIndex: 2,
            }}
          />
        )}

        {/* Selected range: Between handles */}
        <div
          className="absolute bg-primary rounded-md shadow-md"
          style={{
            left: startPosition,
            top: 0,
            width: Math.max(0, selectedWidth),
            height: selectedTrackHeight,
            zIndex: 3,
            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
          }}
        />

        {/* Unselected range: After end handle */}
        {afterEndWidth > 0 && (
          <div
            className="absolute bg-border rounded-sm"
            style={{
              left: endPosition,
              top: (selectedTrackHeight - trackHeight) / 2,
              width: afterEndWidth,
              height: trackHeight,
              zIndex: 2,
            }}
          />
        )}
      </div>
    );
  }
);

SliderTrack.displayName = 'SliderTrack';

export default SliderTrack;
