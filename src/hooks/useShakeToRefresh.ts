import { useEffect } from 'react';

const SHAKE_THRESHOLD = 15; // Lower threshold, magnitude based

export const useShakeToRefresh = (onRefresh: () => void) => {
  useEffect(() => {
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      const currentTime = Date.now();
      
      // Calculate magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > SHAKE_THRESHOLD) {
        if (currentTime - lastTime > 1000) { // 1 second cooldown
          onRefresh();
          lastTime = currentTime;
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion as EventListener);

    return () => {
      window.removeEventListener('devicemotion', handleMotion as EventListener);
    };
  }, [onRefresh]);
};
