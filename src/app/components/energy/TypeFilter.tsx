/**
 * TypeFilter Component
 *
 * Multi-select filter for energy types (Power/Gas).
 * Checkbox-styled buttons (NOT native checkboxes).
 *
 * Design Specifications:
 * - Desktop: Horizontal row, equal width
 * - Mobile: Vertical stack, full width
 * - Checked: Primary subtle background, primary border
 * - Touch target: 44px minimum
 */

'use client';

import React, { memo, useCallback } from 'react';
import { EnergyOptions } from '@/app/types';
import { ENERGY_TYPES, getEnergyTypeLabel } from '@/app/constants/energyTypes';
import { getTypeIcon } from '@/app/utils/iconUtils';

interface TypeFilterProps {
  /** Currently selected energy types */
  selectedTypes: EnergyOptions[];

  /** Callback when selection changes */
  onSelectionChange: (types: EnergyOptions[]) => void;

  /** Optional class name */
  className?: string;

  /** Is component disabled? */
  disabled?: boolean;
}

const TypeFilter: React.FC<TypeFilterProps> = memo(
  ({ selectedTypes, onSelectionChange, className = '', disabled = false }) => {
    // Handle type toggle
    const handleTypeToggle = useCallback(
      (type: EnergyOptions) => {
        if (disabled) return;

        const isSelected = selectedTypes.includes(type);

        if (isSelected) {
          // Deselect: remove from array
          const newSelection = selectedTypes.filter((t) => t !== type);
          onSelectionChange(newSelection);
        } else {
          // Select: add to array
          const newSelection = [...selectedTypes, type];
          onSelectionChange(newSelection);
        }
      },
      [selectedTypes, onSelectionChange, disabled]
    );

    return (
      <div className={`type-filter ${className}`}>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {ENERGY_TYPES.map((type) => {
            const isChecked = selectedTypes.includes(type);
            const label = getEnergyTypeLabel(type);
            const icon = getTypeIcon(type, 'w-5 h-5');

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeToggle(type)}
                disabled={disabled}
                aria-pressed={isChecked}
                aria-label={`Filter ${label} readings`}
                className={`type-filter-button ${isChecked ? `type-filter-button--selected type-filter-button--${type}` : ''}`}
              >
                {/* Energy type icon */}
                {icon}

                {/* Label */}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Screen reader announcement */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {selectedTypes.length === 0
            ? 'No energy types selected'
            : `Selected: ${selectedTypes.map(getEnergyTypeLabel).join(', ')}`}
        </div>
      </div>
    );
  }
);

TypeFilter.displayName = 'TypeFilter';

export default TypeFilter;
