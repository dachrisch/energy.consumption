/**
 * useSliderDrag Hook
 *
 * Handles mouse and touch drag interactions for slider handles.
 * Implements throttling for 60fps performance.
 *
 * Features:
 * - Mouse drag support (desktop)
 * - Touch drag support (mobile)
 * - 60fps throttling (16.67ms intervals)
 * - Position constraints (min/max)
 * - Event cleanup on unmount
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HandleType } from '../types';

interface UseSliderDragParams {
  containerWidth: number;
  minPosition: number;
  maxPosition: number;
  onDragStart: (type: HandleType) => void;
  onDrag: (position: number) => void;
  onDragEnd: () => void;
}

interface UseSliderDragReturn {
  isDragging: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleTouchStart: (event: React.TouchEvent) => void;
}

const THROTTLE_MS = 16.67; // 60fps

/**
 * Custom hook for slider handle drag interactions
 */
export function useSliderDrag({
  containerWidth,
  minPosition,
  maxPosition,
  onDragStart,
  onDrag,
  onDragEnd,
}: UseSliderDragParams): UseSliderDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const containerRef = useRef<HTMLElement | null>(null);

  // Constrain position to min/max bounds
  const constrainPosition = useCallback(
    (position: number): number => {
      return Math.max(minPosition, Math.min(maxPosition, position));
    },
    [minPosition, maxPosition]
  );

  // Calculate position from client X coordinate
  const getPositionFromClientX = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return 0;

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      return constrainPosition(relativeX);
    },
    [constrainPosition]
  );

  // Handle mouse move (throttled)
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < THROTTLE_MS) return;

      lastUpdateRef.current = now;
      const position = getPositionFromClientX(event.clientX);
      onDrag(position);
    },
    [getPositionFromClientX, onDrag]
  );

  // Handle touch move (throttled)
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault(); // Prevent scrolling while dragging

      const now = Date.now();
      if (now - lastUpdateRef.current < THROTTLE_MS) return;

      lastUpdateRef.current = now;
      const touch = event.touches[0];
      if (touch) {
        const position = getPositionFromClientX(touch.clientX);
        onDrag(position);
      }
    },
    [getPositionFromClientX, onDrag]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  // Handle mouse down
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Store container reference
      const target = event.currentTarget as HTMLElement;
      containerRef.current = target.closest('[data-slider-container]');

      setIsDragging(true);
      dragStartXRef.current = event.clientX;
      lastUpdateRef.current = Date.now();

      // Get handle type from data attribute
      const handleType = target.getAttribute('data-handle') as HandleType;
      onDragStart(handleType);
    },
    [onDragStart]
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.stopPropagation();

      const touch = event.touches[0];
      if (!touch) return;

      // Store container reference
      const target = event.currentTarget as HTMLElement;
      containerRef.current = target.closest('[data-slider-container]');

      setIsDragging(true);
      dragStartXRef.current = touch.clientX;
      lastUpdateRef.current = Date.now();

      // Get handle type from data attribute
      const handleType = target.getAttribute('data-handle') as HandleType;
      onDragStart(handleType);
    },
    [onDragStart]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (!isDragging) return;

    // Add mouse/touch move and up/end listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    isDragging,
    handleMouseDown,
    handleTouchStart,
  };
}
