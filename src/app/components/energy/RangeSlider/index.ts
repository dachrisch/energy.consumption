/**
 * RangeSlider Component Exports
 *
 * Main exports for the RangeSlider component and its types.
 */

export { default } from './RangeSlider';
export { default as RangeSlider } from './RangeSlider';

// Export types
export type {
  RangeSliderProps,
  DateRange,
  HandleType,
  SliderState,
  HistogramData,
  DateFormat,
  AnimationConfig,
} from './types';

// Export hooks (if needed externally)
export { useHistogramData } from './hooks/useHistogramData';
export { useSliderKeyboard } from './hooks/useSliderKeyboard';
export { useSliderAnimation } from './hooks/useSliderAnimation';
export { useSliderDrag } from './hooks/useSliderDrag';
