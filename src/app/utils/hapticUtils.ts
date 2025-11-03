/**
 * Haptic feedback utilities for mobile touch interactions
 */

/**
 * Trigger haptic feedback on supported devices
 * @param intensity - 'light', 'medium', or 'heavy'
 */
export const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  // Check if the Vibration API is supported
  if ('vibrate' in navigator) {
    switch (intensity) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
    }
  }
};

/**
 * Trigger haptic feedback for successful actions
 */
export const hapticSuccess = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 50, 10]); // Double tap pattern
  }
};

/**
 * Trigger haptic feedback for errors
 */
export const hapticError = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 100, 20, 100, 20]); // Triple tap pattern
  }
};

/**
 * Trigger haptic feedback for navigation/selection
 */
export const hapticSelection = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
};
