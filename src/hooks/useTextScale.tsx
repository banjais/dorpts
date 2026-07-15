import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextScale = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

interface TextScaleContextType {
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  autoAdjust: boolean;
  setAutoAdjust: (auto: boolean) => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
}

const TextScaleContext = createContext<TextScaleContextType | undefined>(undefined);

export const TextScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textScale, setTextScale] = useState<TextScale>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('text-scale');
        if (saved === 'xsmall' || saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'xlarge' || saved === 'xxlarge') {
          return saved as TextScale;
        }
      } catch {
        // ignore
      }
    }
    return 'medium';
  });

  const [autoAdjust, setAutoAdjust] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('auto-adjust-text-scale');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // ignore
      }
    }
    return true;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('high-contrast-text');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {
        // ignore
      }
    }
    return false;
  });

  // Calculate and apply optimal text scale based on device width (using window.matchMedia & resize listeners)
  useEffect(() => {
    if (!autoAdjust) return;

    const querySmall = window.matchMedia('(max-width: 640px)');
    const queryMedium = window.matchMedia('(min-width: 641px) and (max-width: 1024px)');
    const queryLarge = window.matchMedia('(min-width: 1025px)');

    const evaluateScale = () => {
      // Determine optimal font size scale based on device's screen width
      if (querySmall.matches) {
        setTextScale('large'); // Optimal size on smaller mobile screens for legibility
      } else if (queryMedium.matches) {
        setTextScale('medium'); // Standard size on tablets
      } else if (queryLarge.matches) {
        setTextScale('small'); // Compact size on wide desktop monitors
      }
    };

    // Evaluate initially
    evaluateScale();

    // Listeners for query changes
    try {
      querySmall.addEventListener('change', evaluateScale);
      queryMedium.addEventListener('change', evaluateScale);
      queryLarge.addEventListener('change', evaluateScale);
    } catch {
      // Fallback for older browsers
      querySmall.addListener(evaluateScale);
      queryMedium.addListener(evaluateScale);
      queryLarge.addListener(evaluateScale);
    }

    // Also add a resize listener for extra safety to catch any other window size fluctuations
    const handleResize = () => {
      evaluateScale();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      try {
        querySmall.removeEventListener('change', evaluateScale);
        queryMedium.removeEventListener('change', evaluateScale);
        queryLarge.removeEventListener('change', evaluateScale);
      } catch {
        // Fallback for older browsers
        querySmall.removeListener(evaluateScale);
        queryMedium.removeListener(evaluateScale);
        queryLarge.removeListener(evaluateScale);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [autoAdjust]);

  // Apply class to HTML root element & save to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('text-scale-xs', 'text-scale-sm', 'text-scale-md', 'text-scale-lg', 'text-scale-xl', 'text-scale-xxl');

    if (textScale === 'xsmall') {
      root.classList.add('text-scale-xs');
    } else if (textScale === 'small') {
      root.classList.add('text-scale-sm');
    } else if (textScale === 'medium') {
      root.classList.add('text-scale-md');
    } else if (textScale === 'large') {
      root.classList.add('text-scale-lg');
    } else if (textScale === 'xlarge') {
      root.classList.add('text-scale-xl');
    } else if (textScale === 'xxlarge') {
      root.classList.add('text-scale-xxl');
    }

    // Toggle high contrast class on HTML root element
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    try {
      localStorage.setItem('text-scale', textScale);
      localStorage.setItem('auto-adjust-text-scale', String(autoAdjust));
      localStorage.setItem('high-contrast-text', String(highContrast));
    } catch {
      // ignore
    }
  }, [textScale, autoAdjust, highContrast]);

  return (
    <TextScaleContext.Provider value={{
      textScale,
      setTextScale,
      autoAdjust,
      setAutoAdjust,
      highContrast,
      setHighContrast
    }}>
      {children}
    </TextScaleContext.Provider>
  );
};

export function useTextScale() {
  const context = useContext(TextScaleContext);
  if (context === undefined) {
    throw new Error('useTextScale must be used within a TextScaleProvider');
  }
  return context;
}
