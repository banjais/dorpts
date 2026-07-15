import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, CheckCircle2, AlertTriangle, Clock, Calculator } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getBreakdownStatus } from '../utils/status';
import { Indicator } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const toNepaliNumerals = (n: string | number): string => {
  const map: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };
  return String(n).split('').map((c) => map[c] ?? c).join('');
};

interface ProgressLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  language: 'en' | 'ne';
}

export const ProgressLogicModal: React.FC<ProgressLogicModalProps> = ({
  isOpen,
  onClose,
  indicators,
  language,
}) => {
  useBodyScrollLock(isOpen);

  const weightedRate = useMemo(() => {
    const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
    const achievedWeight = indicators.reduce((acc, curr) => {
      if (!curr) return acc;
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + (achievement * ((curr.weight || 0) / 100));
    }, 0);
    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
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
  const displayRate = num(weightedRate);

  const statusItems = [
    { key: 'onTrack', labelEn: 'On Track', labelNp: 'अनुसरण', value: status.onTrack, color: '#10b981' },
    { key: 'needsAttention', labelEn: 'Needs Attention', labelNp: 'ध्यान', value: status.needsAttention, color: '#f59e0b' },
    { key: 'stale', labelEn: 'Stale', labelNp: 'पुरानो', value: status.stale, color: '#ef4444' },
  ];

  const maxStatus = Math.max(status.onTrack, status.needsAttention, status.stale, 1);

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
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden max-h-[90dvh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'Overall Progress' : 'समग्र प्रगति'}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Strategic Weighted Average' : 'रणनीतिक भारित औसत'}
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

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Big rate */}
              <div className="flex items-center gap-5">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="3.5" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={97.4}
                      initial={{ strokeDashoffset: 97.4 }}
                      animate={{ strokeDashoffset: 97.4 - (97.4 * weightedRate) / 100 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{displayRate}%</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    {language === 'en' ? 'Achievement Rate' : 'उपलब्धि दर'}
                  </p>
                  <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {language === 'en'
                      ? 'Weighted average completion across all active indicators.'
                      : 'सबै सक्रिय सूचकहरूमा भारित औसत पूरा हुने प्रगति।'}
                  </p>
                </div>
              </div>

              {/* Formula */}
              <div className="flex items-start gap-3 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm shrink-0">
                  <Calculator size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'How it is calculated' : 'यसरी गणना गरिन्छ'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                    {language === 'en'
                      ? 'Each indicator’s achievement % (progress ÷ target, capped at 100%) is multiplied by its weight, then averaged across all indicators by total weight.'
                      : 'प्रत्येक सूचकको उपलब्धि % (प्रगति ÷ लक्ष्य, १००% सम्म सीमित) लाई यसको तौलले गुणा गरी सबै सूचकहरूको कुल तौल अनुसार औसत लिइन्छ।'}
                  </p>
                </div>
              </div>

              {/* Status distribution */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                  {language === 'en' ? 'Status Distribution' : 'स्थिति वितरण'}
                </p>
                <div className="space-y-2">
                  {statusItems.map((s) => (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="w-24 sm:w-28 text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        {language === 'en' ? s.labelEn : s.labelNp}
                      </span>
                      <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(s.value / maxStatus) * 100}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] font-black text-slate-800 dark:text-white">{num(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
