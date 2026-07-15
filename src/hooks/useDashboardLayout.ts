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

/**
 * Recommends column spans for a specific widget based on current archetype and total widget count
 */
export const useWidgetSpan = (
  archetype: LayoutArchetype, 
  widgetType: 'primary' | 'secondary' | 'card',
  index: number,
  totalInGroup: number
) => {
  return useMemo(() => {
    if (archetype === 'compact') return 'col-span-1';

    if (archetype === 'balanced') {
      if (widgetType === 'primary') return 'col-span-2';
      return 'col-span-1';
    }

    if (archetype === 'expanded') {
      if (widgetType === 'primary') return 'col-span-1';
      return 'col-span-1';
    }

    if (archetype === 'immersive') {
      if (widgetType === 'primary') {
        // First primary gets a bit more emphasis if there are many
        return index === 0 ? 'col-span-5' : 'col-span-4';
      }
      if (widgetType === 'secondary') return 'col-span-3';
      
      // For status cards group
      if (widgetType === 'card') return 'col-span-4';
      
      return 'col-span-4';
    }

    return 'col-span-1';
  }, [archetype, widgetType, index]);
};
