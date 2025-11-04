/**
 * useSliderAnimation Hook
 *
 * Handles preset animations with smooth transitions.
 * Animates slider handles when presets are clicked.
 *
 * Animation Specifications:
 * - Duration: 300ms
 * - Easing: cubic-bezier(0.4, 0, 0.2, 1) - ease-in-out
 * - Updates: 60fps (every 16.67ms)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DateRange, AnimationConfig } from '../types';

interface UseSliderAnimationParams {
  onAnimationComplete: (range: DateRange) => void;
}

interface UseSliderAnimationReturn {
  isAnimating: boolean;
  animatedRange: DateRange | null;
  animateToRange: (targetRange: DateRange, config?: AnimationConfig) => void;
  cancelAnimation: () => void;
}

// Default animation config
const DEFAULT_CONFIG: AnimationConfig = {
  duration: 300, // 300ms
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Easing function: cubic-bezier(0.4, 0, 0.2, 1)
const cubicBezierEasing = (t: number): number => {
  // Approximation of cubic-bezier(0.4, 0, 0.2, 1)
  const c1 = 0.4;
  const c2 = 0.0;
  const c3 = 0.2;
  const c4 = 1.0;

  const t2 = t * t;
  const t3 = t2 * t;

  return (
    3 * (1 - t) * (1 - t) * t * c1 +
    3 * (1 - t) * t2 * c3 +
    t3
  );
};

/**
 * Interpolate between two dates based on progress (0-1)
 */
const interpolateDate = (start: Date, end: Date, progress: number): Date => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const interpolatedTime = startTime + (endTime - startTime) * progress;
  return new Date(interpolatedTime);
};

/**
 * Custom hook for slider range animations
 */
export function useSliderAnimation({
  onAnimationComplete,
}: UseSliderAnimationParams): UseSliderAnimationReturn {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedRange, setAnimatedRange] = useState<DateRange | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startRangeRef = useRef<DateRange | null>(null);
  const targetRangeRef = useRef<DateRange | null>(null);
  const configRef = useRef<AnimationConfig>(DEFAULT_CONFIG);

  /**
   * Cancel ongoing animation
   */
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsAnimating(false);
    setAnimatedRange(null);
  }, []);

  /**
   * Animation loop
   */
  const animate = useCallback(
    (currentTime: number) => {
      if (!startRangeRef.current || !targetRangeRef.current) {
        cancelAnimation();
        return;
      }

      const elapsed = currentTime - startTimeRef.current;
      const duration = configRef.current.duration;

      // Calculate progress (0 to 1)
      const linearProgress = Math.min(elapsed / duration, 1);
      const easedProgress = cubicBezierEasing(linearProgress);

      // Interpolate dates
      const currentStart = interpolateDate(
        startRangeRef.current.start,
        targetRangeRef.current.start,
        easedProgress
      );
      const currentEnd = interpolateDate(
        startRangeRef.current.end,
        targetRangeRef.current.end,
        easedProgress
      );

      const currentRange: DateRange = {
        start: currentStart,
        end: currentEnd,
      };

      setAnimatedRange(currentRange);

      // Continue or complete animation
      if (linearProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsAnimating(false);
        setAnimatedRange(null);
        onAnimationComplete(targetRangeRef.current);
      }
    },
    [cancelAnimation, onAnimationComplete]
  );

  /**
   * Start animation to target range
   */
  const animateToRange = useCallback(
    (targetRange: DateRange, config: AnimationConfig = DEFAULT_CONFIG) => {
      // Cancel any ongoing animation
      cancelAnimation();

      // Store current range as start
      startRangeRef.current = animatedRange || targetRange;
      targetRangeRef.current = targetRange;
      configRef.current = config;
      startTimeRef.current = performance.now();

      setIsAnimating(true);

      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [animatedRange, cancelAnimation, animate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    animatedRange,
    animateToRange,
    cancelAnimation,
  };
}
