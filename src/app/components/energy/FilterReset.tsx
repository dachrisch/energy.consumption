/**
 * FilterReset Component
 *
 * Reset button with active filter count badge.
 * Uses button-secondary style (not primary).
 *
 * Design Specifications:
 * - Style: button-secondary (gray background)
 * - Badge: Shows count when > 0, hidden when 0
 * - Icon: Reset/rotate icon
 * - Disabled when no filters active
 */

'use client';

import React, { memo, useCallback } from 'react';

interface FilterResetProps {
  /** Number of active filters */
  activeFilterCount: number;

  /** Callback when reset is clicked */
  onReset: () => void;

  /** Optional class name */
  className?: string;

  /** Is component disabled? */
  disabled?: boolean;
}

const FilterReset: React.FC<FilterResetProps> = memo(
  ({ activeFilterCount, onReset, className = '', disabled = false }) => {
    // Handle reset click
    const handleReset = useCallback(() => {
      if (disabled || activeFilterCount === 0) return;
      onReset();
    }, [disabled, activeFilterCount, onReset]);

    const isDisabled = disabled || activeFilterCount === 0;

    return (
      <div className={`filter-reset flex items-center gap-3 ${className}`}>
        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={isDisabled}
          aria-label="Reset all filters"
          className={`
            flex
            items-center
            gap-2
            px-4
            py-2
            rounded-xl
            border-2
            border-transparent
            text-sm
            font-semibold
            transition-all
            duration-150
            ease-in-out
            bg-secondary
            text-secondary-foreground
            ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-secondary-hover hover:transform hover:-translate-y-0.5 hover:shadow-sm cursor-pointer'
            }
            focus-visible:outline-none
            focus-visible:ring-3
            focus-visible:ring-primary-subtle
            focus-visible:ring-offset-2
          `}
        >
          {/* Reset icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>

          {/* Label */}
          <span>Reset Filters</span>
        </button>

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <div
            className="
              inline-flex
              items-center
              justify-center
              min-w-[24px]
              h-6
              px-2
              rounded-full
              bg-primary
              text-primary-foreground
              text-xs
              font-bold
              animate-in
              fade-in
              zoom-in
              duration-150
            "
            aria-label={`${activeFilterCount} active ${
              activeFilterCount === 1 ? 'filter' : 'filters'
            }`}
          >
            {activeFilterCount}
          </div>
        )}
      </div>
    );
  }
);

FilterReset.displayName = 'FilterReset';

export default FilterReset;
