import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatDisplayDate } from '../utils/date';
import { Settings2, Check, ChevronDown, Building, User, TrendingUp, Target, Info, Layers, Minimize2, Maximize2 } from 'lucide-react';
import { normalizeCategory, getCategoryColor } from '../utils/category';

import { triggerHaptic } from '../utils/haptic';
import { highlightText } from '../utils/highlight';

interface IndicatorTableProps {
  indicators: Indicator[];
  updatesHistory?: any[];
  searchQuery?: string;
  onOpenComments?: (indicator: Indicator) => void;
  categoryThemes?: Record<string, string>;
}

const isUpdatedWithin24Hours = (updatedAt?: string) => {
  if (!updatedAt) return false;
  try {
    const updatedTime = new Date(updatedAt).getTime();
    if (isNaN(updatedTime)) return false;
    const now = new Date().getTime();
    const diff = now - updatedTime;
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

interface RowProps {
  ind: Indicator;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRowClick: (ind: Indicator) => void;
  density: 'compact' | 'comfortable';
  columns: any;
  updatesHistory: any[];
  language: string;
  t: any;
  translateUnit: any;
  translateOffice: any;
  totalCols: number;
  searchQuery?: string;
  categoryThemes?: Record<string, string>;
}


const IndicatorTableRow = memo(({ 
  ind, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onRowClick,
  density, 
  columns, 
  updatesHistory, 
  language, 
  t, 
  translateUnit,
  translateOffice,
  totalCols,
  searchQuery = '',
  categoryThemes
}: RowProps) => {
  const percentage = ind.annualTarget > 0 
    ? Math.round((ind.annualProgress / ind.annualTarget) * 100) 
    : 0;
  const contribution = ind.weight ? Math.round(percentage * (ind.weight / 100) * 10) / 10 : 0;

  const primaryName = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
  const secondaryName = language === 'en' ? ind.name : (ind.nameEn || ind.name);
  
  const isRecent = isUpdatedWithin24Hours(ind.updatedAt);
  const tdPadding = density === 'compact' ? 'py-1.5 sm:py-2' : 'py-3 sm:py-4';
  const catColor = getCategoryColor(ind.category, categoryThemes);

  const animateValue = isRecent 
    ? { 
        opacity: 1, 
        x: 0,
        backgroundColor: [
          "rgba(99, 102, 241, 0.02)", 
          "rgba(99, 102, 241, 0.12)", 
          "rgba(99, 102, 241, 0.02)"
        ] 
      } 
    : { opacity: 1, x: 0 };

  const indicatorHistory = React.useMemo(() => {
    if (!updatesHistory || updatesHistory.length === 0) return [];
    return updatesHistory
      .map(historyItem => {
        const indSnap = historyItem.indicators?.find((i: any) => i.id === ind.id || i.name === ind.name);
        if (!indSnap) return null;
        return {
          progress: indSnap.annualProgress,
          target: indSnap.annualTarget,
          updatedAt: historyItem.createdAt || historyItem.updatedAt,
          updatedBy: historyItem.updatedBy || historyItem.email || 'coordinator.iims@gmail.com',
          details: historyItem.details || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [ind.id, ind.name, updatesHistory]);

  const transitionValue = React.useMemo(() => {
    const baseTransition = { delay: index * 0.05, duration: 0.3, ease: "easeOut" };
    if (isRecent) {
      return { 
        ...baseTransition, 
        backgroundColor: { 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } 
      };
    }
    return baseTransition;
  }, [isRecent, index]);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    pressTimerRef.current = setTimeout(() => {
      onRowClick(ind);
      triggerHaptic('medium');
    }, 600);
  }, [ind, onRowClick]);

  const endPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  if (!ind) return null;

  return (
    <>
      <motion.tr 
        id={`row-${ind.id}`}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={animateValue}
        transition={transitionValue}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onClick={() => onRowClick(ind)}
        style={{
          backgroundImage: ind.annualTarget > 0 
            ? `linear-gradient(to right, ${catColor.hex}14 ${Math.min(100, Math.max(0, percentage))}%, transparent ${Math.min(100, Math.max(0, percentage))}%)`
            : 'none'
        }}
        className={`border-b border-slate-100 dark:border-slate-800 transition-colors group cursor-pointer select-none animate-density-row density-${density} ${
          isExpanded ? 'bg-indigo-50/10 dark:bg-slate-800/20' : ''
        } ${density === 'comfortable' ? 'even:bg-slate-50 even:dark:bg-slate-800/50' : ''}`}
      >
        <td className={`px-2 sm:px-5 ${tdPadding} text-center text-[0.625rem] sm:text-xs font-mono text-slate-400 dark:text-slate-500 transition-all duration-300`}>
          <div className="flex items-center justify-center gap-1">
            <ChevronDown 
              size={11} 
              className={`text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-transform duration-300 ${
                isExpanded ? 'rotate-180 text-indigo-500' : ''
              }`} 
            />
            <span>{index + 1}</span>
          </div>
        </td>
        <td className={`px-2 sm:px-5 ${tdPadding} min-w-[100px] sm:min-w-[150px] transition-all duration-300 relative group/cell overflow-visible`}>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.59375rem] sm:text-[0.6875rem] font-bold text-slate-900 dark:text-white leading-tight truncate">
                {highlightText(primaryName, searchQuery)}
              </span>
              {isRecent && (
                <span 
                  title={language === 'en' ? 'Updated within the last 24 hours' : 'गत २४ घण्टा भित्र अद्यावधिक गरिएको'}
                  className="inline-flex items-center gap-1 px-1 py-0.25 rounded-full text-[0.4375rem] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 select-none cursor-help animate-pulse"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                  <span>{language === 'en' ? 'Updated' : 'अद्यावधिक'}</span>
                </span>
              )}
            </div>
            <span className="text-[0.5rem] sm:text-[0.59375rem] text-slate-400 mt-0.5 truncate">
              {highlightText(normalizeCategory(ind.category), searchQuery)}
            </span>
            <span className="text-[0.5rem] sm:text-[0.59375rem] text-slate-400 mt-0.5 truncate">
              {language === 'en' ? 'Weight' : 'भार'}: {ind.weight || 0}%
            </span>
          </div>

          {/* Hover Tooltip for Indicator Name */}
          <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/cell:flex flex-col w-80 sm:w-96 p-4 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2 mb-2">
              <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {language === 'en' ? `SDG ${ind.sdg || '9'}` : `एसडीजी ${ind.sdg || '९'}`}
              </span>
              <span className="text-[0.625rem] font-medium text-slate-400 uppercase tracking-wider">
                {normalizeCategory(ind.category)}
              </span>
            </div>
            
            <h4 className="text-xs font-bold text-white leading-snug mb-1">
              {primaryName}
            </h4>
            <p className="text-[0.625rem] text-slate-400 leading-tight mb-3">
              {secondaryName}
            </p>

            <div className="space-y-2 text-[0.6875rem] border-t border-slate-800/80 pt-2.5">
              <div className="flex items-start gap-1.5">
                <Building size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[0.5625rem] font-semibold uppercase tracking-wider">
                    {language === 'en' ? 'Responsible Office' : 'जिम्मेवार कार्यालय'}
                  </span>
                  <span className="font-bold text-slate-200">
                    {ind.office ? translateOffice(ind.office) : (language === 'en' ? 'Department of Roads' : 'सडक विभाग')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <User size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[0.5625rem] font-semibold uppercase tracking-wider">
                    {language === 'en' ? 'Contact Email' : 'सम्पर्क इमेल'}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 break-all select-all">
                    {ind.gmail || (language === 'en' ? 'Not provided' : 'प्रदान गरिएको छैन')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/40">
                <div>
                  <span className="text-slate-400 block text-[0.5625rem] font-semibold uppercase tracking-wider">
                    {language === 'en' ? 'Frequency' : 'विवरण संकलन चक्र'}
                  </span>
                  <span className="font-bold text-slate-300">
                    {ind.period || (language === 'en' ? 'Quarterly' : 'त्रैमासिक')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[0.5625rem] font-semibold uppercase tracking-wider">
                    {language === 'en' ? 'Weight' : 'भार'}
                  </span>
                  <span className="font-bold text-slate-300">
                    {ind.weight || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </td>
        {columns.baseline && (
          <td className={`px-3 sm:px-5 ${tdPadding} text-[0.625rem] sm:text-[0.6875rem] font-bold text-slate-500 dark:text-slate-400 transition-all duration-300 relative group/cell overflow-visible`}>
            <span>{ind.baseline === "-" || ind.baseline === undefined || ind.baseline === null || ind.baseline === "" ? "-" : ind.baseline}</span>

            {/* Hover Tooltip for Baseline Reference */}
            <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/cell:flex flex-col w-64 p-3.5 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
              <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                <Info size={12} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'en' ? 'Baseline Reference' : 'सुरुवाती अवस्था (बेसलाइन)'}
                </span>
              </div>
              <div className="text-base font-black text-white mb-2 flex items-baseline gap-1">
                {ind.baseline === "-" || ind.baseline === undefined || ind.baseline === null || ind.baseline === "" ? "-" : ind.baseline}
                <span className="text-[0.625rem] text-slate-400 font-bold">{translateUnit(ind.unit)}</span>
              </div>
              <p className="text-[0.6875rem] text-slate-300 leading-normal border-t border-slate-800/80 pt-1.5">
                {language === 'en' 
                  ? 'The initial benchmark recorded at the start of this evaluation cycle. Future progress calculates net growth over this starting state.' 
                  : 'प्रगति र लक्ष्य मापन गर्नका लागि निर्धारण गरिएको सुरुवाती मान। भविष्यका उपलब्धिहरू यही विन्दुबाट गणना गरिन्छ।'}
              </p>
              {typeof ind.baseline === 'number' && ind.annualProgress > 0 && (
                <div className="mt-2 text-[0.625rem] flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                  <TrendingUp size={10} />
                  <span>
                    {language === 'en' 
                      ? `Change from Baseline: ${Math.round(((ind.annualProgress - ind.baseline)/ind.baseline)*100)}%` 
                      : `सुरुवातबाट परिवर्तन: ${Math.round(((ind.annualProgress - ind.baseline)/ind.baseline)*100)}%`}
                  </span>
                </div>
              )}
            </div>
          </td>
        )}
        {columns.target && (
          <td className={`px-3 sm:px-5 ${tdPadding} text-[0.625rem] sm:text-[0.6875rem] font-bold text-slate-600 dark:text-slate-400 transition-all duration-300 relative group/cell overflow-visible`}>
            <span>{ind.annualTarget}</span>

            {/* Hover Tooltip for Target */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/cell:flex flex-col w-64 p-3.5 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
              <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                <Target size={12} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'en' ? 'Annual Target' : 'वार्षिक लक्ष्य'}
                </span>
              </div>
              <div className="text-base font-black text-white mb-2 flex items-baseline gap-1">
                {ind.annualTarget}
                <span className="text-[0.625rem] text-slate-400 font-bold">{translateUnit(ind.unit)}</span>
              </div>
              <p className="text-[0.6875rem] text-slate-300 leading-normal border-t border-slate-800/80 pt-1.5">
                {language === 'en' 
                  ? 'The performance expectation set for the current fiscal year. Completion metrics evaluate active progress against this target.' 
                  : 'चालू आर्थिक वर्षका लागि निर्धारित वार्षिक लक्ष्य। यसै लक्ष्यको विरुद्धमा चालू वर्षको प्रगतिको मूल्याङ्कन गरिन्छ।'}
              </p>
              {ind.totalTarget && (
                <div className="mt-2 text-[0.625rem] text-slate-400 border-t border-slate-800/50 pt-1.5">
                  {language === 'en' ? 'Total Multi-year Target:' : 'कुल दीर्घकालीन लक्ष्य:'}{' '}
                  <span className="font-extrabold text-slate-200">{ind.totalTarget} {translateUnit(ind.unit)}</span>
                </div>
              )}
            </div>
          </td>
        )}
        <td className={`px-2 sm:px-5 ${tdPadding} transition-all duration-300 relative group/cell overflow-visible`}>
          <div className="flex flex-col gap-1 w-16 sm:w-32">
            <div className="flex items-center justify-between gap-0.5">
              <div className="flex items-center gap-0.5">
                <span className="text-[0.59375rem] sm:text-[0.71875rem] font-black text-slate-800 dark:text-slate-200">{ind.annualProgress}</span>
                <span className="text-[0.46875rem] sm:text-[0.5625rem] text-slate-400 font-bold hidden sm:inline">/ {ind.annualTarget}</span>
              </div>
              <div className={`px-1 rounded text-[0.46875rem] sm:text-[0.53125rem] font-black tracking-tighter uppercase whitespace-nowrap ${
                percentage >= 100 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' 
                  : percentage < 50
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
              }`}>
                {percentage}%
              </div>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
              {percentage < 50 ? (
                <motion.div 
                  className="h-full rounded-full bg-rose-500 dark:bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(percentage, 4)}%`,
                    opacity: [0.55, 1, 0.55],
                  }}
                  transition={{
                    width: { type: "spring", stiffness: 60, damping: 12 },
                    opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  }}
                />
              ) : (
                <motion.div 
                  className={`h-full rounded-full ${
                    percentage >= 100 
                      ? 'bg-emerald-500' 
                      : 'bg-indigo-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(percentage, 100)}%`
                  }}
                  transition={{ type: "spring", stiffness: 60, damping: 12 }}
                />
              )}
            </div>
          </div>

          {/* Hover Tooltip for Progress Trends */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/cell:flex flex-col w-72 p-3.5 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
            <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
              <TrendingUp size={12} />
              <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                {language === 'en' ? 'Progress & History' : 'वार्षिक प्रगति र इतिहास'}
              </span>
            </div>
            <div className="text-base font-black text-white mb-2 flex items-baseline gap-1">
              {ind.annualProgress}
              <span className="text-[0.625rem] text-slate-400 font-bold">/ {ind.annualTarget} {translateUnit(ind.unit)}</span>
              <span className="text-xs font-black text-emerald-400 ml-auto">{percentage}%</span>
            </div>

            <div className="border-t border-slate-800/80 pt-2 space-y-1.5">
              <span className="text-[0.5625rem] text-slate-400 block font-semibold uppercase tracking-wider">
                {language === 'en' ? 'Historical Trends' : 'अद्यावधिक इतिहास'}
              </span>
              {indicatorHistory.length > 0 ? (
                <div className="space-y-1 text-[0.625rem]">
                  {indicatorHistory.map((hist, hIdx) => (
                    <div key={hIdx} className="flex flex-col border-b border-slate-800/40 pb-1 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-1 text-slate-300 font-bold">
                        <span>{hist.progress} {translateUnit(ind.unit)} ({hist.target > 0 ? Math.round((hist.progress/hist.target)*100) : 0}%)</span>
                        <span className="text-slate-500 text-[0.5625rem]">
                          {hist.updatedAt ? formatDisplayDate(hist.updatedAt, language) : ''}
                        </span>
                      </div>
                      <span className="text-[0.5625rem] text-slate-500 truncate" title={hist.updatedBy}>
                        by {hist.updatedBy}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[0.625rem] text-slate-500 italic py-1">
                  {language === 'en' 
                    ? 'No local update history entries available. Sync from sheets to load historical logs.' 
                    : 'हालसम्म कुनै इतिहास फेला परेन। विवरणात्मक लग लोड गर्न सिंक गर्नुहोस्।'}
                </div>
              )}
            </div>
          </div>
        </td>
        {columns.unit && (
          <td className={`px-3 sm:px-5 ${tdPadding} transition-all duration-300 relative group/cell overflow-visible`}>
            <span className="text-[0.5625rem] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              {translateUnit(ind.unit)}
            </span>

            {/* Hover Tooltip for Unit */}
            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover/cell:flex flex-col w-56 p-3 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
              <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                <Info size={12} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'en' ? 'Unit of Measurement' : 'मापन एकाइ'}
                </span>
              </div>
              <div className="text-xs font-black text-white mb-1.5 uppercase">
                {translateUnit(ind.unit)}
              </div>
              <p className="text-[0.6875rem] text-slate-350 leading-normal border-t border-slate-800/80 pt-1.5">
                {language === 'en' 
                  ? `This indicator is tracked and aggregated in terms of '${ind.unit}'.`
                  : `यस सूचकको मापन र मूल्याङ्कन '${ind.unit}' एकाइमा गरिन्छ।`}
              </p>
            </div>
          </td>
        )}
        {columns.weight && (
          <td className={`px-3 sm:px-5 ${tdPadding} transition-all duration-300 relative group/cell overflow-visible`}>
            <span className="text-[0.6875rem] font-black text-slate-700 dark:text-slate-300">
              {ind.weight || '-'}
            </span>

            {/* Hover Tooltip for Weight */}
            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover/cell:flex flex-col w-64 p-3.5 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left">
              <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                <Info size={12} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'en' ? 'Indicator Weight' : 'सूचकको भार (Weight)'}
                </span>
              </div>
              <div className="text-base font-black text-white mb-2 flex items-baseline gap-1">
                {ind.weight || '0'}
                <span className="text-[0.625rem] text-indigo-400 font-bold uppercase tracking-wider ml-1">
                  {language === 'en' ? 'Points' : 'अङ्क'}
                </span>
              </div>
              <p className="text-[0.6875rem] text-slate-300 leading-normal border-t border-slate-800/80 pt-1.5">
                {language === 'en' 
                  ? 'The relative weight assigned to this indicator out of the Departmental aggregate score. Higher weights impact overall progress more heavily.' 
                  : 'समग्र सडक विभाग प्रगति सूचकाङ्कमा यस सूचकको सापेक्षिक भार। उच्च भार भएका सूचकहरूले समग्र नतिजामा बढी प्रभाव पार्छन्।'}
              </p>
            </div>
          </td>
        )}
        {columns.contribution && (
          <td className={`px-3 sm:px-5 ${tdPadding} text-right transition-all duration-300 relative group/cell overflow-visible`}>
            <div className="flex flex-col items-end">
              <span className={`text-[0.6875rem] font-black ${percentage >= 100 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                {percentage}%
              </span>
              <span className="text-[0.53125rem] font-bold text-slate-400">+{contribution} {t('weighted')}</span>
            </div>

            {/* Hover Tooltip for Contribution */}
            <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover/cell:flex flex-col w-64 p-3.5 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/50 dark:border-slate-800/80 z-50 animate-in fade-in slide-in-from-bottom-1.5 duration-200 pointer-events-none text-left font-sans">
              <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                <TrendingUp size={12} />
                <span className="text-[0.5625rem] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'en' ? 'Weighted Contribution' : 'समग्र भारित योगदान'}
                </span>
              </div>
              <div className="text-base font-black text-white mb-2 flex items-baseline gap-1">
                +{contribution}
                <span className="text-[0.625rem] text-slate-400 font-bold">
                  {language === 'en' ? 'Weighted Points' : 'भारित अंक'}
                </span>
                <span className="text-xs font-black text-emerald-400 ml-auto">{percentage}%</span>
              </div>
              <p className="text-[0.6875rem] text-slate-300 leading-normal border-t border-slate-800/80 pt-1.5 mb-2">
                {language === 'en' 
                  ? 'Calculated contribution score of this specific indicator towards the overall departmental achievement average.' 
                  : 'यस सूचकले कुल सरकारी विभागको प्रगति सूचकाङ्कमा पुर्याएको खुद भारित योगदान स्कोर।'}
              </p>
              <div className="text-[0.5625rem] text-slate-500 bg-slate-950 p-1.5 rounded font-mono border border-slate-800/60 leading-tight">
                Formula: (Progress % * Weight) / 100<br/>
                Value: ({percentage}% * {ind.weight || 0}) / 100 = {contribution}
              </div>
            </div>
          </td>
        )}
      </motion.tr>

      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-slate-50/30 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800"
          >
            <td colSpan={totalCols} className="px-3 sm:px-5 py-3 sm:py-4 bg-slate-50/10 dark:bg-slate-900/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-xs text-left">
                {/* Baseline Reference */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Baseline Reference' : 'सुरुवाती अवस्था (बेसलाइन)'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {ind.baseline !== undefined && ind.baseline !== null && ind.baseline !== '' ? ind.baseline : (language === 'en' ? 'None' : 'नभएको')}
                    </span>
                    {ind.baseline && ind.unit && (
                      <span className="text-[0.625rem] text-slate-400 font-bold">
                        {translateUnit(ind.unit)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Measurement Unit */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Measurement Unit' : 'मापन एकाइ'}
                  </span>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {translateUnit(ind.unit) || (language === 'en' ? 'N/A' : 'नभएको')}
                    </span>
                  </div>
                </div>

                {/* SDG Alignment */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'SDG Alignment' : 'एसडीजी संरेखण'}
                  </span>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/10">
                       {ind.sdg || (language === 'en' ? 'SDG 9: Infrastructure' : 'SDG ९: पूर्वाधार')}
                    </span>
                  </div>
                </div>

                {/* Responsible Agency */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Responsible Agency' : 'सम्बन्धित कार्यालय / निकाय'}
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={translateOffice(ind.office)}>
                    {ind.office ? translateOffice(ind.office) : (language === 'en' ? 'Department of Roads' : 'सडक विभाग')}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Category' : 'वर्ग (क्याटेगोरी)'}
                  </span>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {normalizeCategory(ind.category)}
                  </div>
                </div>

                {/* Reporting cycle */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Reporting Frequency' : 'विवरण संकलन चक्र'}
                  </span>
                  <div className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase">
                    {ind.period || (language === 'en' ? 'Quarterly' : 'त्रैमासिक')}
                  </div>
                </div>

                {/* Annual vs Total Target */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Annual vs Total Target' : 'वार्षिक र कुल लक्ष्य'}
                  </span>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {language === 'en' ? 'Annual Target:' : 'वार्षिक लक्ष्य:'} <span className="font-extrabold text-slate-800 dark:text-slate-200">{ind.annualTarget}</span>
                    {ind.totalTarget && (
                      <>
                        <span className="mx-1.5">|</span>
                        {language === 'en' ? 'Total Target:' : 'कुल लक्ष्य:'} <span className="font-extrabold text-slate-800 dark:text-slate-200">{ind.totalTarget}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Last Modified Date */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Last Modified' : 'अन्तिम परिमार्जित'}
                  </span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {ind.updatedAt ? formatDisplayDate(ind.updatedAt, language) : (language === 'en' ? 'N/A' : 'नभएको')}
                  </div>
                </div>

                {/* Last Updated By */}
                <div className="space-y-1">
                  <span className="text-[0.5625rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'en' ? 'Last Updated By' : 'अन्तिम सम्पादन कर्ता'}
                  </span>
                  <div className="text-xs font-bold text-slate-550 dark:text-slate-450 truncate" title={ind.gmail || ind.updatedBy}>
                    {ind.gmail || ind.updatedBy || (language === 'en' ? 'Not provided' : 'प्रदान गरिएको छैन')}
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});

IndicatorTableRow.displayName = 'IndicatorTableRow';

export const IndicatorTable: React.FC<IndicatorTableProps> = ({ 
  indicators, 
  updatesHistory = [],
  searchQuery = '',
  onOpenComments,
  categoryThemes
}) => {
  const { language, t, translateUnit, translateOffice } = useLanguage();
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [isSmartGroupingEnabled, setIsSmartGroupingEnabled] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });

  const checkScroll = useCallback(() => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      setScrollState({
        left: scrollLeft > 0,
        right: Math.ceil(scrollLeft + clientWidth) < scrollWidth
      });
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, indicators.length, density]);
  
  const groupedIndicators = React.useMemo(() => {
    if (!isSmartGroupingEnabled) return null;
    return indicators.reduce((acc, ind) => {
      const cat = ind.category || (language === 'en' ? 'Uncategorized' : 'वर्गहीन');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ind);
      return acc;
    }, {} as Record<string, Indicator[]>);
  }, [indicators, isSmartGroupingEnabled, language]);
  
  // Progressive loading for performance with large datasets
  const INITIAL_COUNT = 25;
  const LOAD_MORE_COUNT = 20;
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayCount(INITIAL_COUNT);
  }, [indicators.length]);

  useEffect(() => {
    if (!loadMoreRef.current || displayCount >= indicators.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, indicators.length));
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayCount, indicators.length]);

  const [columns, setColumns] = useState({
    baseline: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
    target: typeof window !== 'undefined' ? window.innerWidth >= 480 : true,
    unit: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
    weight: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
    contribution: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  });

  const effectiveColumns = {
    baseline: columns.baseline && density !== 'compact',
    target: columns.target,
    unit: columns.unit && density !== 'compact',
    weight: columns.weight,
    contribution: columns.contribution,
  };

  const totalCols = 3 + 
    (effectiveColumns.baseline ? 1 : 0) +
    (effectiveColumns.target ? 1 : 0) + 
    (effectiveColumns.unit ? 1 : 0) + 
    (effectiveColumns.weight ? 1 : 0) + 
    (effectiveColumns.contribution ? 1 : 0);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const thPadding = density === 'compact' ? 'py-1.5' : 'py-4';
  const tdPadding = density === 'compact' ? 'py-1 sm:py-1.5' : 'py-3 sm:py-4';

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleIndicators = indicators.slice(0, displayCount);

  const onToggleExpand = useCallback((id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      {/* Table Header / Toolbar */}
      <div className="rounded-t-[32px] px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'en' ? 'Indicator Progress List' : 'सूचक प्रगति विवरण'}
          </span>
          <span className="text-[0.625rem] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
            {indicators.length}
          </span>

          {/* Active Density Status Pill */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.625rem] font-bold transition-all duration-300 ${
            density === 'compact'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/80 dark:text-emerald-400'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/80 dark:text-amber-400'
          }`}>
            {density === 'compact' ? (
              <>
                <Minimize2 size={10} className="animate-pulse" />
                <span>{language === 'en' ? 'Compact View' : 'छोटकरी दृश्य'}</span>
              </>
            ) : (
              <>
                <Maximize2 size={10} className="animate-pulse" />
                <span>{language === 'en' ? 'Detailed View' : 'विस्तृत दृश्य'}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSmartGroupingEnabled(!isSmartGroupingEnabled);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.625rem] font-bold transition-all shadow-sm ${
              isSmartGroupingEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={language === 'en' 
              ? `Turn Smart Grouping ${isSmartGroupingEnabled ? 'OFF' : 'ON'}` 
              : `स्मार्ट ग्रुपिङ ${isSmartGroupingEnabled ? 'अफ' : 'अन'} गर्नुहोस्`}
          >
            <Layers size={12} className={isSmartGroupingEnabled ? 'text-indigo-500' : 'opacity-70'} />
            <span className="hidden sm:inline">
              {language === 'en' 
                ? `Smart Grouping: ${isSmartGroupingEnabled ? 'ON' : 'OFF'}` 
                : `स्मार्ट ग्रुपिङ: ${isSmartGroupingEnabled ? 'अन' : 'अफ'}`}
            </span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[0.625rem] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title={language === 'en' ? 'Toggle columns' : 'स्तम्भहरू टगल गर्नुहोस्'}
            >
              <Settings2 size={12} className="opacity-70" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Columns' : 'स्तम्भहरू'}
              </span>
            </button>

            <AnimatePresence>
              {showColumnMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-[100]"
                >
                  <div className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">
                    {language === 'en' ? 'Show/Hide Columns' : 'स्तम्भहरू देखाउनुहोस्/लुकाउनुहोस्'}
                  </div>
                  {[
                    { key: 'baseline', label: t('baseline') },
                    { key: 'target', label: t('target') },
                    { key: 'unit', label: t('unit') },
                    { key: 'weight', label: t('weight') },
                    { key: 'contribution', label: t('contribution') },
                  ].map((col) => (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key as keyof typeof columns)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {col.label}
                      </span>
                      {columns[col.key as keyof typeof columns] && (
                        <Check size={14} className="text-indigo-500" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Density Toggle */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setDensity(density === 'compact' ? 'comfortable' : 'compact');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.625rem] font-bold transition-all shadow-sm ${
              density === 'compact'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/80 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/80 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/50'
            }`}
              title={language === 'en'
                ? `Switch to ${density === 'compact' ? 'Detailed (comfortable)' : 'Compact'} density`
                : `घनत्व परिवर्तन गर्नुहोस्`}
          >
            {density === 'compact' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span className="hidden sm:inline">
              {language === 'en' 
                ? `Compact View: ${density === 'compact' ? 'ON' : 'OFF'}` 
                : `छोटकरी दृश्य: ${density === 'compact' ? 'अन' : 'अफ'}`}
            </span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-b-[32px]">
        <div className="relative">
          {/* Left Scroll Shadow */}
          <div 
            className={`absolute left-0 top-0 bottom-6 w-4 sm:w-8 bg-gradient-to-r from-slate-200/60 dark:from-slate-900/80 to-transparent pointer-events-none z-30 transition-opacity duration-300 ${scrollState.left ? 'opacity-100' : 'opacity-0'}`} 
          />
          {/* Right Scroll Shadow */}
          <div 
            className={`absolute right-0 top-0 bottom-6 w-4 sm:w-8 bg-gradient-to-l from-slate-200/60 dark:from-slate-900/80 to-transparent pointer-events-none z-30 transition-opacity duration-300 ${scrollState.right ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          <div 
            ref={tableContainerRef}
            onScroll={checkScroll}
            className="overflow-x-auto overflow-y-visible -mx-4 sm:mx-0 relative no-scrollbar pb-6"
          >
          <table className="w-full text-left border-separate border-spacing-0 min-w-[320px] sm:min-w-full">
          <thead>
            <tr className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
              <th className={`px-2 sm:px-5 ${thPadding} w-8 sm:w-12 text-center text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest transition-all duration-300`}>
                {language === 'en' ? 'S.N.' : 'क्र.सं.'}
              </th>
              <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('indicatorName')}</th>
              {effectiveColumns.baseline && <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('baseline')}</th>}
              {effectiveColumns.target && <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('target')}</th>}
              <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('progress')}</th>
              {effectiveColumns.unit && <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('unit')}</th>}
              {effectiveColumns.weight && <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-left transition-all duration-300`}>{t('weight')}</th>}
              {effectiveColumns.contribution && <th className={`px-2 sm:px-5 ${thPadding} text-[0.5rem] sm:text-[0.5625rem] font-black text-slate-400 uppercase tracking-widest text-right transition-all duration-300`}>{t('contribution')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isSmartGroupingEnabled && groupedIndicators ? (
              Object.entries(groupedIndicators as Record<string, Indicator[]>).map(([category, inds]) => {
                const isExpanded = expandedCategories[category] !== false;
                return (
                  <React.Fragment key={category}>
                    <tr 
                      className="bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))}
                    >
                      <td colSpan={totalCols} className="px-5 py-2.5 text-[0.625rem] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        <span className="w-1 h-3 bg-indigo-500 rounded-sm"></span>
                        {category}
                        <span className="ml-auto text-[0.5rem] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold">
                          {inds.length}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && inds.map((ind, index) => (
                      <IndicatorTableRow 
                        key={ind.id}
                        ind={ind}
                        index={index}
                        isExpanded={expandedRowId === ind.id}
                        onToggleExpand={onToggleExpand}
                        onRowClick={setSelectedIndicator}
                        density={density}
                        columns={effectiveColumns}
                        updatesHistory={updatesHistory}
                        language={language}
                        t={t}
                        translateUnit={translateUnit}
                        translateOffice={translateOffice}
                        totalCols={totalCols}
                        searchQuery={searchQuery}
                        categoryThemes={categoryThemes}
                      />
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              visibleIndicators.map((ind, index) => (
                <IndicatorTableRow 
                  key={ind.id}
                  ind={ind}
                  index={index}
                  isExpanded={expandedRowId === ind.id}
                  onToggleExpand={onToggleExpand}
                  onRowClick={setSelectedIndicator}
                  density={density}
                  columns={effectiveColumns}
                  updatesHistory={updatesHistory}
                  language={language}
                  t={t}
                  translateUnit={translateUnit}
                  translateOffice={translateOffice}
                  totalCols={totalCols}
                  searchQuery={searchQuery}
                  categoryThemes={categoryThemes}
                />
              ))
            )}
          </tbody>
        </table>
        
        {displayCount < indicators.length && (
          <div ref={loadMoreRef} className="py-8 flex justify-center items-center">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700/50">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
              <span className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'en' ? 'Loading more indicators...' : 'थप सूचकहरू लोड गर्दै...'}
              </span>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
    </motion.div>
  );
};
