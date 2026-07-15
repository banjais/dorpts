import React from 'react';

export const LoadingSkeleton = () => {
  return (
    <div className="w-full space-y-12">
      {/* Chart Skeleton */}
      <div className="flex justify-center py-10">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[16px] border-slate-100/60 dark:border-slate-800/60 flex items-center justify-center">
          <div className="w-32 h-10 shimmer rounded-lg"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900/60 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="w-1/3 h-4 shimmer rounded-md"></div>
            <div className="w-1/2 h-8 shimmer rounded-md"></div>
            <div className="w-full h-2 shimmer rounded-full"></div>
          </div>
        ))}
      </div>

      {/* List Skeleton */}
      <div className="space-y-4 pt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="flex justify-between">
              <div className="w-1/4 h-5 shimmer rounded-md"></div>
              <div className="w-12 h-5 shimmer rounded-md"></div>
            </div>
            <div className="w-3/4 h-4 shimmer rounded-md"></div>
            <div className="w-1/2 h-4 shimmer rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

