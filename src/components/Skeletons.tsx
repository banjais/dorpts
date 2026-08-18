import React from 'react';
import { motion } from 'motion/react';

const shimmer = {
  hidden: { opacity: 0.4 },
  visible: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 1.2,
      ease: 'easeInOut',
    },
  },
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-full h-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 ${className}`}>
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  </div>
);

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm ${className}`}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full w-2/3 rounded-full bg-slate-300 dark:bg-slate-700"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = '' }) => (
  <div className={`w-full space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full h-[200px] sm:h-[250px] rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 ${className}`}>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex items-end gap-2 h-[140px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-lg bg-slate-200 dark:bg-slate-700"
            animate={{ height: ['40%', '70%', '40%'] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const ShimmerOverlay: React.FC = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none"
    animate={{ x: ['-100%', '200%'] }}
    transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
  />
);
