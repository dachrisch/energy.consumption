/**
 * useSliderKeyboard Hook
 *
 * Handles keyboard navigation for slider handles.
 * Implements WCAG 2.1 AA accessibility requirements.
 *
 * Keyboard Controls:
 * - Arrow Left/Right: Move 1 day
 * - Page Up/Down: Move 7 days (week)
 * - Home/End: Jump to min/max
 * - Shift + Arrow: Fine control (1 hour)
 */

import { useCallback } from 'react';
import { HandleType } from '../types';

interface UseSliderKeyboardParams {
  minDate: Date;
  maxDate: Date;
  startDate: Date;
  endDate: Date;
  onDateChange: (type: HandleType, newDate: Date) => void;
}

interface UseSliderKeyboardReturn {
  handleKeyDown: (event: React.KeyboardEvent, type: HandleType) => void;
}

// Time increments in milliseconds
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;

/**
 * Custom hook for keyboard navigation
 */
export function useSliderKeyboard({
  minDate,
  maxDate,
  startDate,
  endDate,
  onDateChange,
}: UseSliderKeyboardParams): UseSliderKeyboardReturn {
  /**
   * Constrain date to valid range and handle boundaries
   */
  const constrainDate = useCallback(
    (date: Date, type: HandleType): Date => {
      let constrained = new Date(date);

      // Constrain to min/max range
      if (constrained < minDate) constrained = new Date(minDate);
      if (constrained > maxDate) constrained = new Date(maxDate);

      // Prevent handles from crossing
      if (type === 'start' && constrained > endDate) {
        constrained = new Date(endDate);
      } else if (type === 'end' && constrained < startDate) {
        constrained = new Date(startDate);
      }

      return constrained;
    },
    [minDate, maxDate, startDate, endDate]
  );

  /**
   * Adjust date by given milliseconds
   */
  const adjustDate = useCallback(
    (currentDate: Date, delta: number, type: HandleType): Date => {
      const newDate = new Date(currentDate.getTime() + delta);
      return constrainDate(newDate, type);
    },
    [constrainDate]
  );

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, type: HandleType) => {
      const currentDate = type === 'start' ? startDate : endDate;
      let newDate: Date | null = null;
      let preventDefault = true;

      // Determine time increment based on Shift key
      const isShiftPressed = event.shiftKey;
      const smallIncrement = isShiftPressed ? ONE_HOUR : ONE_DAY;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          // Move earlier (decrease)
          newDate = adjustDate(currentDate, -smallIncrement, type);
          break;

        case 'ArrowRight':
        case 'ArrowUp':
          // Move later (increase)
          newDate = adjustDate(currentDate, smallIncrement, type);
          break;

        case 'PageDown':
          // Move 1 week earlier
          newDate = adjustDate(currentDate, -ONE_WEEK, type);
          break;

        case 'PageUp':
          // Move 1 week later
          newDate = adjustDate(currentDate, ONE_WEEK, type);
          break;

        case 'Home':
          // Jump to minimum date (or 1 day after start for end handle)
          if (type === 'start') {
            newDate = new Date(minDate);
          } else {
            // End handle: go to 1 day after start handle
            newDate = adjustDate(startDate, ONE_DAY, type);
          }
          break;

        case 'End':
          // Jump to maximum date (or 1 day before end for start handle)
          if (type === 'end') {
            newDate = new Date(maxDate);
          } else {
            // Start handle: go to 1 day before end handle
            newDate = adjustDate(endDate, -ONE_DAY, type);
          }
          break;

        default:
          // Don't prevent default for other keys (Tab, etc.)
          preventDefault = false;
      }

      // Apply changes if a new date was calculated
      if (newDate && preventDefault) {
        event.preventDefault();
        event.stopPropagation();
        onDateChange(type, newDate);
      }
    },
    [startDate, endDate, minDate, maxDate, adjustDate, onDateChange]
  );

  return {
    handleKeyDown,
  };
}
