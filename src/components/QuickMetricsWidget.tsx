import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Gauge, Target } from 'lucide-react';
import { Indicator } from '../types';

const AnimatedCounter = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
};

interface QuickMetricsWidgetProps {
  indicators: Indicator[];
}

export const QuickMetricsWidget: React.FC<QuickMetricsWidgetProps> = ({ indicators }) => {
  const activeProjects = indicators.filter(i => (i.annualTarget || 0) > 0).length;
  
  const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
  const achievedWeight = indicators.reduce((acc, curr) => {
    if (!curr) return acc;
    const target = curr.annualTarget || 0;
    const progress = curr.annualProgress || 0;
    const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
    return acc + (achievement * ((curr.weight || 0) / 100));
  }, 0);
  const avgProgress = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        Quick Metrics
      </h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target size={12} className="text-indigo-500" />
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Active
            </span>
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={activeProjects} />
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Gauge size={12} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Avg%
            </span>
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={avgProgress} decimals={1} />%
          </span>
        </div>
      </div>
    </div>
  );
};
