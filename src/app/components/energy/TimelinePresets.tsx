/**
 * TimelinePresets Component
 *
 * Displays preset buttons for quick timeline selection.
 * Animates slider handles when preset is clicked.
 *
 * Design Specifications:
 * - Desktop: Flex wrap, 2 rows
 * - Mobile: Horizontal scroll with scroll-snap
 * - Active state: Primary background, white text
 * - Hover: Subtle background change
 */

'use client';

import React, { memo, useCallback } from 'react';
import { TIMELINE_PRESETS, TimelinePreset } from '@/app/constants/timelinePresets';

interface TimelinePresetsProps {
  /** Currently active preset ID */
  activePresetId: string | null;

  /** Callback when preset is clicked */
  onPresetClick: (preset: TimelinePreset) => void;

  /** Optional class name */
  className?: string;

  /** Is component disabled? */
  disabled?: boolean;
}

const TimelinePresets: React.FC<TimelinePresetsProps> = memo(
  ({ activePresetId, onPresetClick, className = '', disabled = false }) => {
    // Handle preset button click
    const handlePresetClick = useCallback(
      (preset: TimelinePreset) => {
        if (disabled) return;
        onPresetClick(preset);
      },
      [disabled, onPresetClick]
    );

    return (
      <div className={`timeline-presets ${className}`}>
        {/* Desktop: Flex wrap, Mobile: Horizontal scroll */}
        <div
          className="flex flex-wrap gap-3 sm:gap-3 overflow-x-auto sm:overflow-visible scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {TIMELINE_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                aria-pressed={isActive}
                aria-label={`Select ${preset.label}`}
                className={`
                  preset-button
                  flex-shrink-0
                  px-4 py-2
                  rounded-xl
                  border-2
                  text-sm
                  font-medium
                  transition-all
                  duration-150
                  ease-in-out
                  ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground shadow-md transform -translate-y-0.5'
                      : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover hover:transform hover:-translate-y-0.5'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  focus-visible:outline-none
                  focus-visible:ring-3
                  focus-visible:ring-primary-subtle
                  focus-visible:ring-offset-2
                `}
                style={{
                  scrollSnapAlign: 'start',
                  minWidth: 'max-content',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

TimelinePresets.displayName = 'TimelinePresets';

export default TimelinePresets;
