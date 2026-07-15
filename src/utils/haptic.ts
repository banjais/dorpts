export const getHapticIntensity = (): 'light' | 'medium' | 'heavy' | 'off' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dor_haptic_intensity');
    if (saved === 'soft') return 'light';
    if (saved === 'strong') return 'heavy';
    if (saved === 'light' || saved === 'medium' || saved === 'heavy' || saved === 'off') {
      return saved as 'light' | 'medium' | 'heavy' | 'off';
    }
  }
  return 'medium';
};

export const setHapticIntensity = (intensity: 'light' | 'medium' | 'heavy' | 'off') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dor_haptic_intensity', intensity);
  }
};

/**
 * Safe utility to trigger mobile device haptic vibration using Web Speech / Device APIs.
 */
export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | number) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const intensity = getHapticIntensity();
      if (intensity === 'off') return;
      
      let multiplier = 1;
      
      if (intensity === 'light') multiplier = 0.5;
      else if (intensity === 'heavy') multiplier = 2;

      const scale = (val: number) => Math.round(val * multiplier);
      const scaleArray = (arr: number[]) => arr.map(scale);

      if (pattern === 'light') {
        navigator.vibrate(scale(10));
      } else if (pattern === 'medium') {
        navigator.vibrate(scale(25));
      } else if (pattern === 'heavy') {
        navigator.vibrate(scale(50));
      } else if (pattern === 'success') {
        navigator.vibrate(scaleArray([15, 40, 15]));
      } else if (pattern === 'warning') {
        navigator.vibrate(scaleArray([40, 60, 40]));
      } else if (typeof pattern === 'number') {
        navigator.vibrate(scale(pattern));
      }
    } catch (e) {
      // Ignore potential iframe security blocks or errors
      console.debug('Haptic feedback not supported or blocked:', e);
    }
  }
};
