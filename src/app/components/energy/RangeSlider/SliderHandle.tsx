/**
 * SliderHandle Component
 *
 * Draggable circular handle for range slider.
 * Supports mouse, touch, and keyboard interactions.
 *
 * Design Specifications:
 * - Size: 20px mobile, 16px desktop
 * - States: normal, hover, dragging, focus
 * - ARIA: role="slider", aria-valuemin/max/now/text
 * - Touch target: 44x44px minimum
 */

'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { SliderHandleProps } from './types';

const SliderHandle: React.FC<SliderHandleProps> = memo(
  ({
    type,
    position,
    date,
    isDragging,
    isFocused,
    onDragStart,
    onDrag: _onDrag,
    onDragEnd: _onDragEnd,
    onKeyDown,
    onFocus,
    onBlur,
    minPosition,
    maxPosition,
    containerWidth: _containerWidth,
    className = '',
  }) => {
    // Handle sizes (responsive)
    const handleSize = useMemo(() => {
      // Check if mobile (using media query approach in style)
      return {
        mobile: 20,
        desktop: 16,
      };
    }, []);

    // Touch target size (44x44px minimum for accessibility)
    const touchTargetSize = 44;

    // Calculate aria values (0-100 scale)
    const ariaValueNow = useMemo(() => {
      const range = maxPosition - minPosition;
      if (range === 0) return 0;
      const normalizedPosition = (position - minPosition) / range;
      return Math.round(normalizedPosition * 100);
    }, [position, minPosition, maxPosition]);

    // Format date for aria-valuetext
    const ariaValueText = useMemo(() => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }, [date]);

    // Handle mouse down
    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onDragStart(type);
      },
      [type, onDragStart]
    );

    // Handle touch start
    const handleTouchStart = useCallback(
      (event: React.TouchEvent) => {
        event.stopPropagation();
        onDragStart(type);
      },
      [type, onDragStart]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        onKeyDown(event, type);
      },
      [type, onKeyDown]
    );

    // Visual state classes
    const stateClasses = useMemo(() => {
      const classes = ['transition-all duration-150 ease-in-out'];

      if (isDragging) {
        classes.push('scale-120 bg-primary-active shadow-lg cursor-grabbing');
      } else if (isFocused) {
        classes.push('scale-100 bg-primary-hover shadow-md');
      } else {
        classes.push('scale-100 bg-primary shadow-md hover:scale-110 hover:bg-primary-hover hover:shadow-lg cursor-grab');
      }

      return classes.join(' ');
    }, [isDragging, isFocused]);

    // Calculate handle position (centered on position)
    const handleStyle = useMemo(() => {
      const size = isDragging ? handleSize.mobile * 1.2 : handleSize.mobile;
      return {
        left: `${position}px`,
        transform: 'translateX(-50%)',
        width: `${size}px`,
        height: `${size}px`,
        zIndex: isDragging ? 10 : 4,
      };
    }, [position, isDragging, handleSize]);

    // Touch target style (invisible overlay for larger touch area)
    const touchTargetStyle = useMemo(() => {
      return {
        left: `${position}px`,
        transform: 'translateX(-50%)',
        width: `${touchTargetSize}px`,
        height: `${touchTargetSize}px`,
      };
    }, [position, touchTargetSize]);

    return (
      <>
        {/* Invisible touch target (44x44px minimum) */}
        <div
          className="absolute top-0"
          style={touchTargetStyle}
          aria-hidden="true"
        />

        {/* Visible handle */}
        <div
          role="slider"
          aria-label={type === 'start' ? 'Start date' : 'End date'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaValueNow}
          aria-valuetext={ariaValueText}
          aria-orientation="horizontal"
          tabIndex={0}
          data-handle={type}
          className={`absolute rounded-full border-3 border-white ${stateClasses} ${className}`}
          style={handleStyle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {/* Focus indicator (outline) */}
          {isFocused && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                outline: '3px solid rgba(124, 58, 237, 0.3)',
                outlineOffset: '3px',
              }}
            />
          )}
        </div>
      </>
    );
  }
);

SliderHandle.displayName = 'SliderHandle';

export default SliderHandle;
