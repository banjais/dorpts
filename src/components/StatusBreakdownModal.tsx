import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle2, Clock, BarChart3, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Indicator } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { getBreakdownStatus } from '../utils/status';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface StatusBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  language: 'en' | 'ne';
  onSelectIndicator?: (indicator: Indicator) => void;
}

type StatusCategory = 'onTrack' | 'needsAttention' | 'stale';

const CATEGORY_CONFIG: Record<StatusCategory, { labelEn: string; labelNp: string; color: string; bg: string; icon: React.ReactNode }> = {
  onTrack: {
    labelEn: 'On Track',
    labelNp: 'अनुसरण',
    color: '#10b981',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    icon: <CheckCircle2 size={16} className="text-emerald-600" />,
  },
  needsAttention: {
    labelEn: 'Needs Attention',
    labelNp: 'ध्यान',
    color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    icon: <AlertTriangle size={16} className="text-amber-600" />,
  },
  stale: {
    labelEn: 'Stale',
    labelNp: 'पुरानो',
    color: '#ef4444',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:bg-rose-800/40',
    icon: <Clock size={16} className="text-rose-600" />,
  },
};

function getIndicatorStatus(ind: Indicator): StatusCategory {
  return getBreakdownStatus(ind);
}

export const StatusBreakdownModal: React.FC<StatusBreakdownModalProps> = ({ isOpen, onClose, indicators, language, onSelectIndicator }) => {
  useBodyScrollLock(isOpen);

  const categorized = useMemo(() => {
    const map: Record<StatusCategory, Indicator[]> = { onTrack: [], needsAttention: [], stale: [] };
    indicators.forEach(ind => {
      if (!ind) return;
      const status = getIndicatorStatus(ind);
      map[status].push(ind);
    });
    return map;
  }, [indicators]);

  const chartData = useMemo(() => [
    { name: 'On Track', value: categorized.onTrack.length, color: '#10b981' },
    { name: 'Attention', value: categorized.needsAttention.length, color: '#f59e0b' },
    { name: 'Stale', value: categorized.stale.length, color: '#ef4444' },
  ], [categorized]);

  const total = indicators.length || 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden max-h-[90dvh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {language === 'en' ? `${indicators.length} indicators tracked` : `${indicators.length} सूचकहरू ट्र्याक गरियो`}
                    </p>
                 </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* Logic Explanation */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                    <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    {language === 'en' ? 'How status is calculated' : 'स्थिति कसरी गणना गरिन्छ'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        {language === 'en' ? 'On Track' : 'अनुसरण'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'Progress ≥ 60% of annual target AND updated within 30 days.'
                        : 'वार्षिक लक्ष्यको ६०% वा बढी प्रगति र ३० दिनभित्र अपडेट।'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-amber-100 dark:border-amber-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        {language === 'en' ? 'Needs Attention' : 'ध्यान'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'Progress < 60% of annual target (but updated within 30 days).'
                        : 'वार्षिक लक्ष्यको ६०% भन्दा कम प्रगति (तर ३० दिनभित्र अपडेट)।'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-rose-100 dark:border-rose-800/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-rose-600" />
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        {language === 'en' ? 'Stale' : 'पुरानो'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'No update recorded, OR last update was more than 30 days ago.'
                        : 'कुनै अपडेट छैन, वा अन्तिम अपडेट ३० दिन भन्दा पुरानो छ।'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [`${value} indicators`, name]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-2">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {language === 'en' ? 'Total' : 'कुल'}
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white">{indicators.length}</p>
                    </div>
                  </div>
                </div>

                {/* Category Columns */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(CATEGORY_CONFIG) as StatusCategory[]).map((key) => {
                    const config = CATEGORY_CONFIG[key];
                    const items = categorized[key];
                    const pct = Math.round((items.length / total) * 100);
                    return (
                      <div key={key} className={`rounded-2xl p-3.5 border ${config.bg}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          {config.icon}
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {language === 'en' ? config.labelEn : config.labelNp}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              {items.length} · {pct}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                          {items.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">None</p>
                          )}
                           {items.slice(0, 12).map((ind) => (
                             <div
                               key={ind.id}
                               onClick={() => onSelectIndicator?.(ind)}
                               className="flex items-start gap-2 bg-white/60 dark:bg-slate-900/60 rounded-lg px-2.5 py-2 border border-slate-100 dark:border-slate-800/50 cursor-pointer hover:border-indigo-400/50 hover:shadow-sm transition-all"
                             >
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: config.color }} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                  {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                                </p>
                                <p className="text-[8px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  {ind.annualTarget > 0 ? `${Math.round((ind.annualProgress / ind.annualTarget) * 100)}%` : '—'}
                                </p>
                              </div>
                            </div>
                          ))}
                          {items.length > 12 && (
                            <p className="text-[9px] text-slate-400 text-center pt-1">
                              +{items.length - 12} {language === 'en' ? 'more' : 'थप'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
