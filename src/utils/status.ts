import { Indicator } from '../types';

export type StatusType = 'excellent' | 'onTrack' | 'progressing' | 'atRisk' | 'delayed';

export type BreakdownStatus = 'onTrack' | 'needsAttention' | 'stale';

export function getBreakdownStatus(ind: Indicator): BreakdownStatus {
  if (!ind.updatedAt) return 'stale';
  const lastUpdated = new Date(ind.updatedAt);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24);
  if (daysSinceUpdate > 30) return 'stale';

  const pct = ind.annualTarget > 0 ? (ind.annualProgress / ind.annualTarget) * 100 : 0;
  if (pct >= 60) return 'onTrack';
  return 'needsAttention';
}

export const getStatusBadge = (percent: number, t: (key: string) => string): { label: string; className: string; status: StatusType } => {
  if (percent >= 80) {
    return { 
      label: t('excellent') || (percent >= 90 ? 'Excellent' : 'Exceeding'), 
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      status: 'excellent'
    };
  }
  if (percent >= 60) {
    return { 
      label: t('onTrack'), 
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      status: 'onTrack'
    };
  }
  if (percent >= 40) {
    return { 
      label: t('progressing') || 'Progressing', 
      className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
      status: 'progressing'
    };
  }
  if (percent >= 20) {
    return { 
      label: t('atRisk'), 
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      status: 'atRisk'
    };
  }
  return { 
    label: t('delayed'), 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    status: 'delayed'
  };
};
