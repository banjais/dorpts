
export const normalizeCategory = (category: string | undefined | null): string => {
  if (!category) return 'Infrastructure Creation';
  
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.includes('infrastructure')) return 'Infrastructure Creation';
  if (lower.includes('maintenance') || lower.includes('मर्मत')) return 'Maintenance';
  if (lower.includes('employment') || lower.includes('रोजगारी')) return 'Employment Creation';
  if (lower.includes('budget') || lower.includes('बजेट')) return 'Budget Utilization';
  if (lower.includes('governance') || lower.includes('सुशासन')) return 'Governance';
  
  // Return the trimmed original if it doesn't match standard ones, 
  // but most should fall into the above for this app.
  return trimmed;
};

export const STANDARD_CATEGORIES = [
  'Infrastructure Creation',
  'Maintenance',
  'Employment Creation',
  'Budget Utilization',
  'Governance'
] as const;

export type StandardCategory = typeof STANDARD_CATEGORIES[number];

export const DEFAULT_CATEGORY_THEMES: Record<string, string> = {
  'Infrastructure Creation': '#3b82f6', // blue-500
  'Maintenance': '#10b981', // emerald-500
  'Employment Creation': '#f59e0b', // amber-500
  'Budget Utilization': '#6366f1', // indigo-500
  'Governance': '#a855f7', // purple-500
};

export const getCategoryColor = (category: string | undefined | null, customThemes?: Record<string, string>) => {
  const norm = normalizeCategory(category);
  const hex = customThemes?.[norm] || DEFAULT_CATEGORY_THEMES[norm] || '#64748b';
  
  return {
    hex,
    // We can't easily generate tailwind classes for dynamic hex, 
    // so components should use inline styles for the color if it's dynamic.
    // But for the default ones, we can keep the classes if we want.
    border: `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, 0.2)`
  };
};
