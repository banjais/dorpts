import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Clock, User, ArrowRight, TrendingUp, HelpCircle, 
  CheckCircle, Database, Calendar, Weight, FileSpreadsheet, 
  ShieldAlert, Sparkles, RefreshCw, BarChart2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Indicator } from '../types';

interface ActivityDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null; // Selected update log entry from updates_history
  updatesHistory: any[];
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  isOpen,
  onClose,
  entry,
  updatesHistory = []
}) => {
  const { language, t } = useLanguage();

  // Find the 'Before' snapshot preceding the current entry in chronological order
  const comparisonData = useMemo(() => {
    if (!entry) return null;

    // Sort chronologically to find the true preceding snapshot
    const sortedHistory = [...updatesHistory].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.id).getTime();
      const bTime = new Date(b.createdAt || b.id).getTime();
      return aTime - bTime;
    });

    const currentIdx = sortedHistory.findIndex(h => h.id === entry.id);
    const beforeEntry = currentIdx > 0 ? sortedHistory[currentIdx - 1] : null;

    const afterIndicators = entry.indicators || [];
    const beforeIndicators = beforeEntry?.indicators || [];

    const changes = afterIndicators.map((afterInd: any) => {
      if (!afterInd) return null;
      const beforeInd = beforeIndicators.find((b: any) => b && (b.id === afterInd.id || b.name === afterInd.name));
      
      const beforeVal = beforeInd ? beforeInd.annualProgress : 0;
      const afterVal = afterInd.annualProgress;
      const target = afterInd.annualTarget || 100;
      
      const beforePct = target > 0 ? Math.min(100, Math.round((beforeVal / target) * 100)) : 0;
      const afterPct = target > 0 ? Math.min(100, Math.round((afterVal / target) * 100)) : 0;
      
      const diffProgress = afterVal - beforeVal;
      const diffPct = afterPct - beforePct;

      // Status badges
      const getStatusType = (pct: number) => {
        if (pct >= 80) return { label: language === 'en' ? 'On Track' : 'सञ्चालनमा', color: 'emerald' };
        if (pct >= 50) return { label: language === 'en' ? 'At Risk' : 'जोखिम', color: 'amber' };
        return { label: language === 'en' ? 'Delayed' : 'ढिलाइ', color: 'rose' };
      };

      return {
        id: afterInd.id,
        name: afterInd.name,
        nameEn: afterInd.nameEn || afterInd.name,
        beforeVal,
        afterVal,
        beforePct,
        afterPct,
        target,
        diffProgress,
        diffPct,
        beforeStatus: getStatusType(beforePct),
        afterStatus: getStatusType(afterPct),
        hasChanged: beforeVal !== afterVal
      };
    });

    // Compute aggregate changes
    const beforeWeightProg = beforeEntry?.metadata?.totalWeightProgress || 0;
    const afterWeightProg = entry?.metadata?.totalWeightProgress || 0;
    const diffWeightProg = afterWeightProg - beforeWeightProg;

    return {
      beforeEntry,
      changes,
      beforeWeightProg,
      afterWeightProg,
      diffWeightProg,
    };
  }, [entry, updatesHistory, language]);

  const toNepaliNumerals = (numStr: string | number): string => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
  };

  const formatNumber = (num: number, isPercentage = false): string => {
    const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 1 });
    const suffix = isPercentage ? '%' : '';
    return language === 'np' ? `${toNepaliNumerals(formatted)}${suffix}` : `${formatted}${suffix}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return language === 'np' ? toNepaliNumerals(dateStr) : dateStr;
      }
      return d.toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return language === 'np' ? toNepaliNumerals(dateStr) : dateStr;
    }
  };

  if (!entry || !comparisonData) return null;

  const adminEmail = entry.metadata?.updatedBy || 'coordinator.iims@gmail.com';
  const totalIndicatorsCount = entry.indicators?.length || 0;
  const changedIndicatorsCount = comparisonData.changes.filter(c => c.hasChanged).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-[2500] backdrop-blur-sm"
            id="activity-drawer-backdrop"
          />

          {/* Drawer Slide-in container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-[#0f172a] shadow-2xl border-l border-slate-200 dark:border-slate-800 z-[2600] flex flex-col overflow-hidden"
            id="activity-detail-drawer"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-[#0f172a]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <Database className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block">
                      {language === 'en' ? 'Administrative Audit Trail' : 'प्रशासकीय लेखापरीक्षण विवरण'}
                    </span>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                      {language === 'en' ? 'Sync Log Comparison' : 'सिंक लग तुलना विवरण'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-150 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-800/80"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Log Metadata Banner */}
              <div className="grid grid-cols-2 gap-4 mt-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/60 shadow-inner">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Synchronized By' : 'सिङ्क्रोनाइज गर्ने प्रयोगकर्ता'}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
                    <User size={14} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{adminEmail}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Snapshot Timestamp' : 'स्न्यापसट समय'}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <span>{formatDate(entry.createdAt || entry.lastUpdateDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Aggregate Weight Progress Stats Comparison */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-800/60 p-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Weight size={15} className="text-indigo-500" />
                  {language === 'en' ? 'Aggregate Portfolio Achievement rate' : 'समग्र पोर्टफोलियो उपलब्धि दर'}
                </h4>

                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Before */}
                  <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {language === 'en' ? 'Before Sync' : 'सिंक अघि'}
                    </span>
                    <span className="text-xl font-black text-slate-500">
                      {formatNumber(comparisonData.beforeWeightProg, true)}
                    </span>
                  </div>

                  {/* Transition Arrow */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <ArrowRight size={16} />
                    </div>
                    {comparisonData.diffWeightProg !== 0 && (
                      <span className={`text-[10px] font-black mt-1.5 px-1.5 py-0.5 rounded-md ${
                        comparisonData.diffWeightProg > 0 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                      }`}>
                        {comparisonData.diffWeightProg > 0 ? '+' : ''}{formatNumber(comparisonData.diffWeightProg, true)}
                      </span>
                    )}
                  </div>

                  {/* After */}
                  <div className="text-center p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/40 shadow-sm ring-1 ring-indigo-500/10">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                      {language === 'en' ? 'After Sync' : 'सिंक पछि'}
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatNumber(comparisonData.afterWeightProg, true)}
                    </span>
                  </div>
                </div>

                {/* Progress bar transition */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>{language === 'en' ? 'Weighted Target Achievement Progression' : 'भारित लक्ष्य उपलब्धि प्रगति'}</span>
                    <span className="text-slate-600 dark:text-slate-350">{formatNumber(comparisonData.afterWeightProg, true)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative shadow-inner">
                    {/* Before progress */}
                    <motion.div 
                      className="absolute left-0 top-0 h-full bg-slate-400 dark:bg-slate-650 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${comparisonData.beforeWeightProg}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 12 }}
                    />
                    {/* Growth progress delta */}
                    {comparisonData.diffWeightProg > 0 && (
                      <motion.div 
                        className="absolute h-full bg-gradient-to-r from-emerald-400 to-indigo-500 animate-pulse"
                        initial={{ width: 0, left: `${comparisonData.beforeWeightProg}%` }}
                        animate={{ 
                          left: `${comparisonData.beforeWeightProg}%`, 
                          width: `${comparisonData.diffWeightProg}%` 
                        }}
                        transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.15 }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Feed of indicator-level updates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-indigo-500" />
                    {language === 'en' ? 'Indicator-level Verification Logs' : 'सूचक-स्तर प्रमाणीकरण विवरण लग'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-bold text-slate-400">
                      {changedIndicatorsCount} {language === 'en' ? 'Modified' : 'परिवर्तित'}
                    </span>
                    <span className="text-slate-200">|</span>
                    <span className="text-[9.5px] font-bold text-slate-400">
                      {totalIndicatorsCount} {language === 'en' ? 'Total' : 'कुल'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {comparisonData.changes.map((change) => {
                    const isGrowth = change.diffProgress > 0;
                    const isShrink = change.diffProgress < 0;

                    return (
                      <div 
                        key={change.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          change.hasChanged 
                            ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/[0.01] border-indigo-500/20 ring-1 ring-indigo-500/5' 
                            : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/60 opacity-85'
                        }`}
                      >
                        {/* Title and sectoral indicator info */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                              ID: {change.id}
                            </span>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-snug">
                              {language === 'en' ? change.nameEn : change.name}
                            </h5>
                          </div>

                          {/* Delta Badge */}
                          {change.hasChanged ? (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                              isGrowth 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {isGrowth ? '▲ +' : '▼ '}{formatNumber(change.diffProgress)} ({formatNumber(change.diffPct, true)})
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40 shrink-0">
                              {language === 'en' ? 'No Change' : 'अपरिवर्तित'}
                            </span>
                          )}
                        </div>

                        {/* Side-by-side Progress Metrics */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                          {/* Before values */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                              {language === 'en' ? 'Before Value' : 'पहिलेको मान'}
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                                {formatNumber(change.beforeVal)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                / {formatNumber(change.target)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="text-[10px] font-black text-slate-500">
                                {change.beforePct}%
                              </span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500`}>
                                {change.beforeStatus.label}
                              </span>
                            </div>
                          </div>

                          {/* After values */}
                          <div className="space-y-1 border-l border-slate-200/50 dark:border-slate-800/50 pl-4">
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">
                              {language === 'en' ? 'After Value' : 'पछिल्लो मान'}
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {formatNumber(change.afterVal)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                / {formatNumber(change.target)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                {change.afterPct}%
                              </span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                                change.afterStatus.color === 'emerald' 
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                                  : change.afterStatus.color === 'amber'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}>
                                {change.afterStatus.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dual bar comparison chart inside item */}
                        {change.hasChanged && (
                          <div className="mt-3.5 space-y-2">
                            {/* Before progression bar */}
                            <div className="flex items-center gap-3 text-[9px] font-medium">
                              <span className="w-12 text-slate-400 text-right font-bold uppercase">{language === 'en' ? 'Before' : 'पहिले'}</span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-slate-400 dark:bg-slate-650 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${change.beforePct}%` }}
                                  transition={{ type: "spring", stiffness: 60, damping: 12 }}
                                />
                              </div>
                              <span className="w-7 text-slate-450 font-bold">{change.beforePct}%</span>
                            </div>

                            {/* After progression bar */}
                            <div className="flex items-center gap-3 text-[9px] font-medium">
                              <span className="w-12 text-indigo-500 text-right font-black uppercase">{language === 'en' ? 'After' : 'पछिल्लो'}</span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full rounded-full ${
                                    change.afterStatus.color === 'emerald' ? 'bg-emerald-500' : change.afterStatus.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${change.afterPct}%` }}
                                  transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.1 }}
                                />
                              </div>
                              <span className="w-7 text-indigo-600 dark:text-indigo-400 font-black">{change.afterPct}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer / Verification Stamp */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-450 dark:text-slate-500">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {language === 'en' ? 'Audit Status: Verified' : 'लेखापरीक्षण अवस्था: प्रमाणित'}
                </span>
                <span className="font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200/50 dark:border-slate-700 shadow-sm text-[9.5px]">
                  ID: SNAP-{entry.id}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
