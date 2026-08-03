import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutGrid, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getBreakdownStatus } from '../utils/status';
import { Indicator } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { STANDARD_CATEGORIES, getCategoryColor, normalizeCategory } from '../utils/category';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const toNepaliNumerals = (n: string | number): string => {
  const map: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };
  return String(n).split('').map((c) => map[c] ?? c).join('');
};

interface IndicatorsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  language: 'en' | 'ne';
}

export const IndicatorsBreakdownModal: React.FC<IndicatorsBreakdownModalProps> = ({
  isOpen,
  onClose,
  indicators,
  language,
}) => {
  useBodyScrollLock(isOpen);

  const total = indicators.length || 1;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    STANDARD_CATEGORIES.forEach((c) => (counts[c] = 0));
    indicators.forEach((ind) => {
      if (!ind) return;
      const cat = normalizeCategory(ind.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return STANDARD_CATEGORIES.map((c) => ({
      name: c,
      value: counts[c] || 0,
      color: getCategoryColor(c).hex,
    }));
  }, [indicators]);

  const status = useMemo(() => {
    const map: Record<string, number> = { onTrack: 0, needsAttention: 0, stale: 0 };
    indicators.forEach((ind) => {
      if (!ind) return;
      const s = getBreakdownStatus(ind);
      map[s] += 1;
    });
    return { onTrack: map.onTrack, needsAttention: map.needsAttention, stale: map.stale };
  }, [indicators]);

  const num = (n: number) => (language === 'ne' ? toNepaliNumerals(n) : n);

  const statusItems = [
    { key: 'onTrack', labelEn: 'On Track', labelNp: 'अनुसरण', value: status.onTrack, color: '#10b981', icon: <CheckCircle2 size={14} /> },
    { key: 'needsAttention', labelEn: 'Needs Attention', labelNp: 'ध्यान', value: status.needsAttention, color: '#f59e0b', icon: <AlertTriangle size={14} /> },
    { key: 'stale', labelEn: 'Stale', labelNp: 'पुरानो', value: status.stale, color: '#ef4444', icon: <Clock size={14} /> },
  ];

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
                  <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'Indicators Breakdown' : 'सूचक विवरण'}
                  </h3>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {language === 'en' ? `${indicators.length} indicators tracked` : `${num(indicators.length)} सूचकहरू ट्र्याक गरियो`}
                    </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut by category */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [`${value}`, name]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-2">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {language === 'en' ? 'Total' : 'कुल'}
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white">{num(indicators.length)}</p>
                    </div>
                  </div>
                </div>

                {/* Category bars */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryData.map((cat) => {
                    const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                    return (
                      <div key={cat.name} className="rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/50 bg-slate-50/60 dark:bg-slate-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                            {language === 'en' ? cat.name : cat.name}
                          </span>
                          <span className="text-[11px] font-black text-slate-800 dark:text-white">{num(cat.value)}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status summary */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {statusItems.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center gap-2.5 rounded-2xl p-3 border"
                    style={{
                      backgroundColor: `${s.color}14`,
                      borderColor: `${s.color}40`,
                    }}
                  >
                    <div style={{ color: s.color }}>{s.icon}</div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {language === 'en' ? s.labelEn : s.labelNp}
                      </p>
                      <p className="text-base font-black text-slate-800 dark:text-white leading-none">{num(s.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
