/**
 * EnergyTableFilters Component (V3 - Interactive Timeline Slider)
 *
 * Complete redesign with:
 * - Interactive timeline slider with histogram visualization
 * - Preset buttons for quick selection
 * - Multi-select type filter (checkboxes, not radio buttons)
 * - Reset button with active filter badge
 *
 * Mobile-first responsive design.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { EnergyType, EnergyOptions } from '@/app/types';
import RangeSlider from './RangeSlider';
import TimelinePresets from './TimelinePresets';
import TypeFilter from './TypeFilter';
import FilterReset from './FilterReset';
import { TimelinePreset, isAllTimePreset } from '@/app/constants/timelinePresets';
import { DateRange } from './RangeSlider/types';

interface EnergyTableFiltersProps {
  /** All energy data for histogram visualization */
  energyData: EnergyType[];

  /** Currently selected energy types (multi-select) */
  selectedTypes: EnergyOptions[];

  /** Callback when selected types change */
  onTypesChange: (types: EnergyOptions[]) => void;

  /** Current date range selection */
  dateRange: DateRange;

  /** Callback when date range changes */
  onDateRangeChange: (range: DateRange) => void;

  /** Callback when reset is clicked */
  onReset: () => void;

  /** Optional class name */
  className?: string;
}

const EnergyTableFilters: React.FC<EnergyTableFiltersProps> = ({
  energyData,
  selectedTypes,
  onTypesChange,
  dateRange,
  onDateRangeChange,
  onReset,
  className = '',
}) => {
  // Track active preset
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Calculate min/max dates from data
  const { minDate, maxDate } = useMemo(() => {
    if (energyData.length === 0) {
      const now = new Date();
      return {
        minDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        maxDate: now,
      };
    }

    const dates = energyData.map((item) => new Date(item.date));
    return {
      minDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  }, [energyData]);

  // Handle preset click
  const handlePresetClick = useCallback(
    (preset: TimelinePreset) => {
      setActivePresetId(preset.id);

      // Calculate preset range
      const range = preset.calculateRange();

      // For "All time", use actual min/max from data
      if (isAllTimePreset(preset.id)) {
        onDateRangeChange({
          start: minDate,
          end: maxDate,
        });
      } else {
        // Clamp preset range to actual data range
        const clampedStart =
          range.start < minDate ? minDate : range.start > maxDate ? maxDate : range.start;
        const clampedEnd =
          range.end > maxDate ? maxDate : range.end < minDate ? minDate : range.end;

        onDateRangeChange({
          start: clampedStart,
          end: clampedEnd,
        });
      }
    },
    [minDate, maxDate, onDateRangeChange]
  );

  // Handle manual slider change (deselects preset)
  const handleSliderChange = useCallback(
    (range: DateRange) => {
      setActivePresetId(null); // Deselect preset
      onDateRangeChange(range);
    },
    [onDateRangeChange]
  );

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Timeline filter: active if not "All time" or manually adjusted
    const isFullRange =
      dateRange.start.getTime() === minDate.getTime() &&
      dateRange.end.getTime() === maxDate.getTime();
    if (!isFullRange) {
      count++;
    }

    // Type filter: active if not all types selected
    if (selectedTypes.length > 0 && selectedTypes.length < 2) {
      // Assuming 2 types total (power, gas)
      count++;
    }

    return count;
  }, [dateRange, minDate, maxDate, selectedTypes]);

  // Handle reset
  const handleReset = useCallback(() => {
    setActivePresetId(null);
    onReset();
  }, [onReset]);

  return (
    <div className={`energy-table-filters solid-container ${className}`}>
      <div className="flex flex-col gap-6">
        {/* Timeline Filter Section */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-foreground">Timeline Filter</label>

          {/* Preset Buttons */}
          <TimelinePresets
            activePresetId={activePresetId}
            onPresetClick={handlePresetClick}
          />

          {/* Range Slider with Histogram */}
          <RangeSlider
            data={energyData}
            dateRange={dateRange}
            onDateRangeChange={handleSliderChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>

        {/* Type Filter Section */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">Energy Type</label>
          <TypeFilter selectedTypes={selectedTypes} onSelectionChange={onTypesChange} />
        </div>

        {/* Reset Section */}
        <div className="flex justify-end">
          <FilterReset activeFilterCount={activeFilterCount} onReset={handleReset} />
        </div>
      </div>
    </div>
  );
};

export default EnergyTableFilters;
