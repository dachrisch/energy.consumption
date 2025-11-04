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
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  border-2
                  text-sm
                  font-medium
                  transition-all
                  duration-150
                  ease-in-out
                  min-h-[44px]
                  sm:flex-1
                  ${
                    isChecked
                      ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
                      : 'bg-transparent border-muted text-foreground-muted hover:bg-background-hover hover:border-border hover:text-foreground'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  focus-visible:outline-none
                  focus-visible:ring-3
                  focus-visible:ring-primary-subtle
                  focus-visible:ring-offset-2
                `}
              >
                {/* Checkbox indicator (visual only) */}
                <span
                  className={`
                    w-5
                    h-5
                    rounded-md
                    border-2
                    flex
                    items-center
                    justify-center
                    transition-all
                    ${
                      isChecked
                        ? 'bg-primary border-primary'
                        : 'bg-transparent border-border'
                    }
                  `}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

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
