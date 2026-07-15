import { useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptic';

/**
 * Custom hook that automatically listens for touch-initiated pointer events
 * on all major interactive elements (buttons, switches, inputs, cards)
 * to trigger crisp haptic feedback. Also provides manual trigger functions.
 */
export function useHaptic() {
  const triggerLight = useCallback(() => triggerHaptic('light'), []);
  const triggerMedium = useCallback(() => triggerHaptic('medium'), []);
  const triggerSuccess = useCallback(() => triggerHaptic('success'), []);
  const triggerWarning = useCallback(() => triggerHaptic('warning'), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only trigger on mobile/tablet touch interaction
      if (e.pointerType !== 'touch') return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find the closest interactive parent element
      const interactiveEl = target.closest(
        'button, [role="button"], [role="switch"], [role="tab"], a, input, select, textarea, .cursor-pointer, [onClick]'
      );

      if (interactiveEl) {
        // Prevent double trigger if we bubble up or if multiple listeners exist
        const isToggle =
          interactiveEl.getAttribute('role') === 'switch' ||
          interactiveEl.classList.contains('toggle') ||
          (interactiveEl.tagName === 'INPUT' && 
            ['checkbox', 'radio'].includes((interactiveEl as HTMLInputElement).type));

        if (isToggle) {
          triggerHaptic('medium'); // Clear feedback for state toggles
        } else {
          triggerHaptic('light');  // Snappy feedback for normal presses/taps
        }
      }
    };

    // Attach event listener on window with passive option for optimal scroll performance
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return {
    triggerLight,
    triggerMedium,
    triggerSuccess,
    triggerWarning,
  };
}
