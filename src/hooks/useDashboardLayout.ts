import { useMemo } from 'react';

/**
 * Archetypes for dashboard layouts
 */
export type LayoutArchetype = 'compact' | 'balanced' | 'expanded' | 'immersive';

interface LayoutConfig {
  gridCols: number;
  gap: number;
  archetype: LayoutArchetype;
}

export const useDashboardLayout = (containerWidth: number) => {
  return useMemo((): LayoutConfig => {
    // Immersive: Large desktops (1280px+)
    if (containerWidth >= 1280) {
      return {
        gridCols: 12,
        gap: 6,
        archetype: 'immersive'
      };
    }
    // Expanded: Desktops (1024px - 1279px)
    if (containerWidth >= 1024) {
      return {
        gridCols: 3,
        gap: 6,
        archetype: 'expanded'
      };
    }
    // Balanced: Tablets (768px - 1023px)
    if (containerWidth >= 768) {
      return {
        gridCols: 2,
        gap: 6,
        archetype: 'balanced'
      };
    }
    // Compact: Mobile (< 768px)
    return {
      gridCols: 1,
      gap: 4,
      archetype: 'compact'
    };
  }, [containerWidth]);
};
