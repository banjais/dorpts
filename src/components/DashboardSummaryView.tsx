import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Indicator, SystemMetadata, Toast } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, getBreakdownStatus } from '../utils/status';
import { normalizeCategory, getCategoryColor, STANDARD_CATEGORIES } from '../utils/category';
import { triggerHaptic } from '../utils/haptic';
import { HISTORICAL_DATA } from '../historicalData';
import { formatNepaliDate } from '../utils/date';
import {
  Filter,
  ChevronDown,
  ChevronRight,
  Target,
  MessageSquare,
  History,
  Edit3,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Info,
  MoreHorizontal,
  LayoutGrid,
  Activity,
  Wallet,
  PiggyBank,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  X,
  Calculator,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { PortfolioHealthChart } from './PortfolioHealthChart';
import { IndicatorHeatmap } from './IndicatorHeatmap';
import { KPISummaryChart } from './KPISummaryChart';
import { MetricsChart } from './MetricsChart';
import { TrendAnalysisView } from './TrendAnalysisView';
import CategoryInsightsChart from './CategoryInsightsChart';
import { StatusBreakdownModal } from './StatusBreakdownModal';
import { IndicatorsBreakdownModal } from './IndicatorsBreakdownModal';
import { ProgressLogicModal } from './ProgressLogicModal';
import { SystemHelpModal } from './SystemHelpModal';
import { SplashScreen } from './SplashScreen';

interface DashboardSummaryViewProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  offices: { name: string; updated: string; avgCompletion?: number; total?: number; onTrack?: number; attention?: number; stale?: number }[];
  updatesHistory?: any[];
  onOpenAbout?: (tab?: string) => void;
  onOpenDataHealth?: () => void;
  onIndicatorClick?: (indicator: Indicator) => void;
  onOpenComments?: (indicator: Indicator) => void;
  onViewHistory?: (indicator: Indicator) => void;
  onSelectIndicatorFromBreakdown?: (indicator: Indicator) => void;
  addToast?: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning', duration?: number) => void;
  highlightedCard?: 'insights' | null;
  isFooterExpanded?: boolean;
  isAtBottom?: boolean;
  onCardsReachedHeader?: (reached: boolean) => void;
  onCardsHidden?: (hidden: boolean) => void;
}

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
};

const CATEGORY_SHORT_LABELS: Record<string, { en: string; np: string }> = {
  'Infrastructure Creation': { en: 'Infrastructure', np: 'पूर्वाधार' },
  'Maintenance': { en: 'Maintenance', np: 'मर्मत' },
  'Employment Creation': { en: 'Employment', np: 'रोजगारी' },
  'Budget Utilization': { en: 'Budget', np: 'बजेट' },
  'Governance': { en: 'Governance', np: 'सुशासन' },
};

const getSparklineData = (
  indicatorId: string,
  currentProgress: number,
  currentTarget: number,
  currentDate?: string,
): { date: string; value: number }[] => {
  const points: { date: string; value: number }[] = [];

  HISTORICAL_DATA.forEach((snapshot) => {
    const histInd = snapshot.indicators.find((h) => h.id === indicatorId);
    if (histInd) {
      const pct = histInd.annualTarget > 0 ? Math.round((histInd.annualProgress / histInd.annualTarget) * 100) : 0;
      points.push({ date: snapshot.lastUpdateDate, value: Math.min(pct, 100) });
    }
  });

  const currentPct = currentTarget > 0 ? Math.round((currentProgress / currentTarget) * 100) : 0;
  points.push({ date: currentDate || 'Now', value: Math.min(currentPct, 100) });

  const deduped = points.filter((p, i, arr) => i === 0 || p.date !== arr[i - 1].date || p.value !== arr[i - 1].value);
  if (deduped.length < 2 && deduped.length > 0) {
    const baseline = { date: deduped[0].date.includes('/') ? '२०८१/०१/०१' : '2021/01/01', value: 0 };
    return [baseline, deduped[0]];
  }

  return deduped.slice(-5);
};

const CustomSparklineTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 dark:border-white/10 px-2.5 py-1.5 rounded-xl shadow-xl text-[10px] text-white font-medium pointer-events-none backdrop-blur-sm z-50">
        <div className="font-extrabold text-indigo-400">
          {language === 'en' ? 'Progress' : 'प्रगति'}: {data.value}%
        </div>
        <div className="text-slate-300 font-semibold mt-0.5">
          {language === 'en' ? 'Date' : 'मिति'}: {data.date}
        </div>
      </div>
    );
  }
  return null;
};

const MiniSparkline: React.FC<{
  data: { date: string; value: number }[];
  color: string;
  language: 'en' | 'np';
}> = ({ data, color, language }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="h-8 w-16 sm:w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={[0, 100]} />
          <RechartsTooltip
            content={<CustomSparklineTooltip language={language} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '2 2' }}
            allowEscapeViewBox={{ x: true, y: true }}
            position={{ y: -45 }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 1 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ExpandedDetails: React.FC<{
  indicator: Indicator;
  language: 'en' | 'np';
  sparklineData: { date: string; value: number }[];
  isAdmin: boolean;
  onViewHistory?: (ind: Indicator) => void;
  onOpenComments?: (ind: Indicator) => void;
  onClick?: () => void;
}> = ({ indicator, language, sparklineData, isAdmin, onViewHistory, onOpenComments, onClick }) => {
  const [viewMode, setViewMode] = useState<'annual' | 'total'>('annual');
  const target = viewMode === 'annual' ? indicator.annualTarget : indicator.totalTarget;
  const progress = viewMode === 'annual' ? indicator.annualProgress : indicator.totalProgress;
  const pct = target && target > 0 ? Math.round((progress / target) * 100) : 0;
  const catColor = getCategoryColor(indicator.category);
  const weight = indicator.weight || 0;
  const weightedContribution = pct > 0 ? Math.round((pct * weight) / 100) : 0;
  const fmt = (val: number | string): string => {
    if (language === 'ne') return toNepaliNumerals(val);
    return String(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {language === 'en' ? 'Progress Trend' : 'प्रगति प्रवृत्ति'}
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-100 dark:border-white/5">
              <button
                onClick={() => setViewMode('annual')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Annual' : 'वार्षिक'}
              </button>
              <button
                onClick={() => setViewMode('total')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  viewMode === 'total' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Total' : 'कुल'}
              </button>
            </div>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id={`grad-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={catColor.hex} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={catColor.hex} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} fontWeight={600} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={8} fontWeight={600} />
                <RechartsTooltip content={<CustomSparklineTooltip language={language} />} />
                <Area type="monotone" dataKey="value" stroke={catColor.hex} strokeWidth={2} fill={`url(#grad-${indicator.id})`} dot={{ r: 3, fill: catColor.hex, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {language === 'en' ? 'Target vs Progress' : 'लक्ष्य र प्रगति'}
              </span>
              <span className={`text-xs font-black ${pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                {fmt(pct)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: catColor.hex }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                {language === 'en' ? 'Target' : 'लक्ष्य'}: {fmt(target != null ? target.toLocaleString() : '—')}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                {language === 'en' ? 'Progress' : 'प्रगति'}: {fmt(progress != null ? progress.toLocaleString() : '—')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                {language === 'en' ? 'Baseline' : 'आधारभूत'}
              </div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                {indicator.baseline != null && (indicator.baseline as any)?.toLocaleString
                  ? fmt((indicator.baseline as any).toLocaleString())
                  : fmt(indicator.baseline || '—')}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                {language === 'en' ? 'Unit' : 'एकाई'}
              </div>
              <div className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                {indicator.unit || '—'}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
              {language === 'en' ? 'Calculation Logic' : 'गणना विधि'}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'en' ? 'Weighted' : 'भारित'}: {weight} × {pct}% = <span className="text-indigo-600 dark:text-indigo-400">{weightedContribution}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en' ? 'Formula' : 'सूत्र'}: (Progress% × Weight) / 100
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-300">
            <Calendar size={10} />
            <span className="font-semibold">
              {language === 'en' ? 'Updated' : 'अद्यावधिक'}:{' '}
              {indicator.updatedAt ? formatNepaliDate(indicator.updatedAt, language === 'np' ? 'np' : 'en') : '—'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {onViewHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(indicator);
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold min-w-[44px] justify-center"
              >
                <MoreHorizontal size={10} />
                {language === 'en' ? 'More' : 'थप'}
              </button>
            )}
            {onOpenComments && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments(indicator);
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold min-w-[44px] justify-center"
              >
                <MessageSquare size={10} />
                {language === 'en' ? 'Comments' : 'टिप्पणी'}
              </button>
            )}
            {isAdmin && onClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-[10px] font-bold min-w-[44px] justify-center"
              >
                <Edit3 size={10} />
                {language === 'en' ? 'Edit' : 'सम्पादन'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getCardGradient = (status: { status: string }, categoryColor: { hex: string }) => {
  const base = categoryColor.hex;
  if (status.status === 'onTrack' || status.status === 'excellent') {
    return 'from-emerald-500/90 via-teal-500 to-cyan-500';
  }
  if (status.status === 'delayed' || status.status === 'atRisk') {
    return 'from-rose-500/90 via-orange-500 to-amber-500';
  }
  if (status.status === 'progressing') {
    return 'from-amber-500/90 via-orange-400 to-rose-400';
  }
  return 'from-slate-400/80 via-slate-500 to-slate-600';
};

const SummaryCard: React.FC<{
  indicator: Indicator;
  language: 'en' | 'np';
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  sparklineData: { date: string; value: number }[];
  status: { label: string; className: string; status: string };
  progressPercent: number;
  isAdmin: boolean;
  onViewHistory?: (ind: Indicator) => void;
  onOpenComments?: (ind: Indicator) => void;
  index: number;
  translateUnit?: (unit: string) => string;
  addToast?: (toast: Toast) => void;
}> = ({ indicator, language, isExpanded, onToggle, onClick, sparklineData, status, progressPercent, isAdmin, onViewHistory, onOpenComments, index, translateUnit, addToast }) => {
  const catColor = getCategoryColor(indicator.category);
  const gradient = getCardGradient(status, catColor);
  const nepaliPercent = language === 'ne' ? toNepaliNumerals(progressPercent.toString()) : progressPercent.toString();
  const weight = indicator.weight || 0;
  const trendDirection = sparklineData.length >= 2
    ? sparklineData[sparklineData.length - 1].value - sparklineData[0].value
    : 0;
  const isTrendUp = trendDirection > 0;
  const isTrendDown = trendDirection < 0;
  const fmt = (val: number | string): string => {
    if (language === 'ne') return toNepaliNumerals(val);
    return String(val);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="relative"
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onToggle}
        className={`relative w-full rounded-[24px] border overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl'
        }`}
      >
        {/* Top gradient accent strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

        <div className="p-3 sm:p-4 text-left">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: catColor.hex }}
              />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                {normalizeCategory(indicator.category).split(' ')[0]}
              </span>
              {isTrendUp && (
                <TrendingUp size={12} className="text-emerald-500 shrink-0" />
              )}
              {isTrendDown && (
                <TrendingDown size={12} className="text-rose-500 shrink-0" />
              )}
              {!isTrendUp && !isTrendDown && sparklineData.length >= 2 && (
                <span className="text-[10px] font-black text-slate-400 shrink-0">—</span>
              )}
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${status.className}`}>
              {status.label}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mb-2">
            {language === 'en' ? indicator.nameEn : indicator.name}
          </h4>

          {/* Big metric */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">
                {nepaliPercent}%
              </div>
              <div className="flex items-center gap-2 mt-1.5 min-w-0">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                   {language === 'en' ? 'Weight' : 'भार'}: {fmt(weight)}%
                 </span>
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                   {fmt(indicator.annualProgress?.toLocaleString() ?? 0)} / {fmt(indicator.annualTarget?.toLocaleString() ?? 0)}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-100 dark:border-white/5">
                <ExpandedDetailsSmall
                  indicator={indicator}
                  language={language}
                  sparklineData={sparklineData}
                  isAdmin={isAdmin}
                  onViewHistory={onViewHistory}
                  onOpenComments={onOpenComments}
                  onClick={onClick}
                />
              </div>
              {/* Footer row with update log - only visible when expanded */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <Calendar size={10} />
                  <span>
                    {indicator.updatedAt
                      ? formatNepaliDate(indicator.updatedAt, language === 'np' ? 'np' : 'en')
                      : '—'}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronDown size={12} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};

const ExpandedDetailsSmall: React.FC<{
  indicator: Indicator;
  language: 'en' | 'np';
  sparklineData: { date: string; value: number }[];
  isAdmin: boolean;
  onViewHistory?: (ind: Indicator) => void;
  onOpenComments?: (ind: Indicator) => void;
  onClick?: () => void;
 }> = ({ indicator, language, sparklineData, isAdmin, onViewHistory, onOpenComments, onClick }) => {
  const catColor = getCategoryColor(indicator.category);
  const target = indicator.annualTarget || 0;
  const progress = indicator.annualProgress || 0;
  const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
  const fmt = (val: number | string): string => {
    if (language === 'ne') return toNepaliNumerals(val);
    return String(val);
  };

  return (
    <div className="space-y-3">
      {/* Mini chart */}
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`grad-card-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={catColor.hex} stopOpacity={0.3} />
                <stop offset="95%" stopColor={catColor.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={8} fontWeight={600} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={8} fontWeight={600} />
            <RechartsTooltip content={<CustomSparklineTooltip language={language} />} />
            <Area type="monotone" dataKey="value" stroke={catColor.hex} strokeWidth={2} fill={`url(#grad-card-${indicator.id})`} dot={{ r: 3, fill: catColor.hex, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Target vs Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Target vs Progress' : 'लक्ष्य र प्रगति'}
          </span>
          <span className={`text-xs font-black ${pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
            {fmt(pct)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: catColor.hex }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
            {language === 'en' ? 'Target' : 'लक्ष्य'}: {fmt(target.toLocaleString())}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
            {language === 'en' ? 'Progress' : 'प्रगति'}: {fmt(progress.toLocaleString())}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {onViewHistory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(indicator);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold"
          >
            <MoreHorizontal size={10} />
            {language === 'en' ? 'More' : 'थप'}
          </button>
        )}
        {onOpenComments && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(indicator);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold"
          >
            <MessageSquare size={10} />
            {language === 'en' ? 'Comments' : 'टिप्पणी'}
          </button>
        )}
        {isAdmin && onClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-[10px] font-bold"
          >
            <Edit3 size={10} />
            {language === 'en' ? 'Edit' : 'सम्पादन'}
          </button>
        )}
      </div>
    </div>
  );
};

export const DashboardSummaryView: React.FC<DashboardSummaryViewProps> = ({
  indicators,
  metadata,
  offices,
  updatesHistory = [],
  onOpenAbout,
  onOpenDataHealth,
  onIndicatorClick,
  onOpenComments,
  onViewHistory,
  onSelectIndicatorFromBreakdown,
  addToast,
  highlightedCard,
  isFooterExpanded,
  isAtBottom: _isAtBottomProp,
  onCardsReachedHeader,
  onCardsHidden,
}) => {
  const { language, setLanguage, t, translateUnit, translateOffice } = useLanguage();
  const { isAdmin } = useAuth();
  const isNepali = language === 'ne';
  const fmt = (val: number | string): string => {
    if (isNepali) return toNepaliNumerals(val);
    return String(val);
  };
  const insightsCardRef = useRef<HTMLDivElement>(null);
  const lastCardRef = useRef<HTMLDivElement>(null);
  const [cardsReachedHeader, setCardsReachedHeader] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortType, setSortType] = useState<'default' | 'low' | 'high' | 'weight' | 'status'>('default');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [insightTab, setInsightTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>('health');
  const [portfolioMode, setPortfolioMode] = useState<'bar' | 'pie'>('bar');
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(false);
  const [showIndicatorsBreakdown, setShowIndicatorsBreakdown] = useState(false);
  const [showProgressLogic, setShowProgressLogic] = useState(false);
  const [showOfficeLogicInfo, setShowOfficeLogicInfo] = useState(false);
  const [showStatusLogicInline, setShowStatusLogicInline] = useState(false);
  const [showIndicatorsLogicInline, setShowIndicatorsLogicInline] = useState(false);
  const [showOverallLogicInline, setShowOverallLogicInline] = useState(false);
  const [showCategoryLogicInline, setShowCategoryLogicInline] = useState(false);
  const [showReportingOfficesLogicInline, setShowReportingOfficesLogicInline] = useState(false);
  const [showSystemHelpModal, setShowSystemHelpModal] = useState(false);
  const [showBudgetCard, setShowBudgetCard] = useState(false);
  const [showOverallProgress, setShowOverallProgress] = useState(false);
  const [cardsHidden, setCardsHidden] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [showTotalIndicators, setShowTotalIndicators] = useState(false);
  const [showReportingOffices, setShowReportingOffices] = useState(false);
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [showCategoryStatus, setShowCategoryStatus] = useState(false);
  const allIndicatorsRef = useRef<HTMLDivElement>(null);

  const closeAllCards = useCallback(() => {
    setShowOverallProgress(false);
    setShowStatusDetails(false);
    setShowTotalIndicators(false);
    setShowReportingOffices(false);
    setShowAllIndicators(false);
    setShowCategoryStatus(false);
    setShowBudgetCard(false);
    setShowInsights(false);
    setShowStatusBreakdown(false);
    setShowIndicatorsBreakdown(false);
    setShowProgressLogic(false);
    setShowOfficeLogicInfo(false);
    setShowStatusLogicInline(false);
    setShowIndicatorsLogicInline(false);
    setShowOverallLogicInline(false);
    setShowCategoryLogicInline(false);
    setShowReportingOfficesLogicInline(false);
    setExpandedId(null);
  }, []);

  const toggleCard = useCallback((setter: (value: boolean) => void, currentValue: boolean) => {
    closeAllCards();
    if (!currentValue) {
      setter(true);
    }
  }, [closeAllCards]);

  useEffect(() => {
    const states = [
      showOverallProgress,
      showStatusDetails,
      showTotalIndicators,
      showReportingOffices,
      showAllIndicators,
      showCategoryStatus,
      showBudgetCard,
      showInsights,
    ];
    const openedIndex = states.findIndex(Boolean);
    if (openedIndex === -1) return;
    const setters = [
      setShowOverallProgress,
      setShowStatusDetails,
      setShowTotalIndicators,
      setShowReportingOffices,
      setShowAllIndicators,
      setShowCategoryStatus,
      setShowBudgetCard,
      setShowInsights,
    ];
    setters.forEach((setter, index) => {
      if (index !== openedIndex) setter(false);
    });
  }, [showOverallProgress, showStatusDetails, showTotalIndicators, showReportingOffices, showAllIndicators, showCategoryStatus, showBudgetCard, showInsights]);

  useEffect(() => {
    if (highlightedCard !== 'insights') return;
    closeAllCards();
    setShowInsights(true);
    const timer = setTimeout(() => {
      insightsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightedCard]);

  useEffect(() => {
    const handleScroll = () => {
      if (!lastCardRef.current) return;
      const headerHeight = window.innerWidth < 640 ? 150 : 170;
      const cardRect = lastCardRef.current.getBoundingClientRect();
      const reached = cardRect.bottom <= headerHeight;
      setCardsReachedHeader(reached);
      onCardsReachedHeader?.(reached);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onCardsReachedHeader]);

  useEffect(() => {
    if (cardsReachedHeader) {
      const timer = setTimeout(() => {
        setCardsHidden(true);
        onCardsHidden?.(true);
      }, 700);
      return () => clearTimeout(timer);
    }
    setCardsHidden(false);
    onCardsHidden?.(false);
  }, [cardsReachedHeader, onCardsHidden]);

  const weightedAchievementRate = useMemo(() => {
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

  const filteredIndicators = useMemo(() => {
    let list = [...(indicators || [])].filter(Boolean);

    if (categoryFilter !== 'All') {
      list = list.filter((ind) => {
        if (!ind) return false;
        return normalizeCategory(ind.category) === categoryFilter;
      });
    }

    if (sortType === 'low') {
      list.sort((a, b) => {
        const pctA = a.annualTarget > 0 ? (a.annualProgress / a.annualTarget) * 100 : 0;
        const pctB = b.annualTarget > 0 ? (b.annualProgress / b.annualTarget) * 100 : 0;
        return pctA - pctB;
      });
    } else if (sortType === 'high') {
      list.sort((a, b) => {
        const pctA = a.annualTarget > 0 ? (a.annualProgress / a.annualTarget) * 100 : 0;
        const pctB = b.annualTarget > 0 ? (b.annualProgress / b.annualTarget) * 100 : 0;
        return pctB - pctA;
      });
    } else if (sortType === 'weight') {
      list.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    } else if (sortType === 'status') {
      const statusOrder: Record<string, number> = { delayed: 0, atRisk: 1, progressing: 2, onTrack: 3, excellent: 4 };
      const getStatus = (ind: Indicator) => {
        const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
        return pct < 20 ? 'delayed' : pct < 40 ? 'atRisk' : pct < 60 ? 'progressing' : pct < 80 ? 'onTrack' : 'excellent';
      };
      list.sort((a, b) => (statusOrder[getStatus(a)] || 0) - (statusOrder[getStatus(b)] || 0));
    }

    return list;
  }, [indicators, categoryFilter, sortType]);

  const stats = useMemo(() => {
    const onTrack = indicators.filter((ind) => {
      if (!ind) return false;
      return getBreakdownStatus(ind) === 'onTrack';
    }).length;
    const needsAttention = indicators.filter((ind) => {
      if (!ind) return false;
      return getBreakdownStatus(ind) === 'needsAttention';
    }).length;
    const staleCount = indicators.filter((ind) => {
      if (!ind) return false;
      return getBreakdownStatus(ind) === 'stale';
    }).length;

    const meetingTarget = indicators.filter((ind) => {
      if (!ind) return false;
      const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
      return pct >= 80;
    }).length;
    const belowTarget = indicators.filter((ind) => {
      if (!ind) return false;
      const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
      return pct >= 40 && pct < 80;
    }).length;
    const needsCritical = indicators.filter((ind) => {
      if (!ind) return false;
      const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
      return pct < 40;
    }).length;

    return {
      total: indicators.length,
      onTrack,
      needsAttention,
      staleCount,
      meetingTarget,
      belowTarget,
      needsCritical,
      weightedRate: weightedAchievementRate,
    };
  }, [indicators, weightedAchievementRate]);

  const reportingOffices = useMemo(() => {
    const emailMap = new Map<string, Set<string>>();

    indicators.forEach((ind) => {
      if (!ind || !ind.office) return;
      const email = (ind.gmail || ind.updatedBy || '').trim();
      if (email) {
        if (!emailMap.has(ind.office)) {
          emailMap.set(ind.office, new Set());
        }
        emailMap.get(ind.office)!.add(email);
      }
    });

    return (offices || [])
      .filter((office) => office.name.includes('-'))
      .map((office) => {
        const avgCompletion = office.avgCompletion ?? 0;
        return {
          office: office.name,
          emails: emailMap.get(office.name) || new Set(),
          score: avgCompletion,
          avgCompletion,
          onTrack: office.onTrack ?? 0,
          attention: office.attention ?? 0,
          stale: office.stale ?? 0,
          total: office.total ?? 0,
        };
      })
      .sort((a, b) => b.avgCompletion - a.avgCompletion);
  }, [indicators, offices]);

  const handleToggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleIndicatorAction = (ind: Indicator, action: 'click' | 'history' | 'comments') => {
    triggerHaptic('medium');
    if (action === 'click' && onIndicatorClick) {
      onIndicatorClick(ind);
    } else if (action === 'history' && onViewHistory) {
      onViewHistory(ind);
    } else if (action === 'comments' && onOpenComments) {
      onOpenComments(ind);
    }
  };

  useEffect(() => {
    if (!showAllIndicators) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (allIndicatorsRef.current && !allIndicatorsRef.current.contains(target)) {
        setShowAllIndicators(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAllIndicators]);

  useEffect(() => {
    if (!showSplash) return;
    const hasLang = localStorage.getItem("language");
    if (hasLang) {
      const timer = setTimeout(() => setShowSplash(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <div className="relative min-h-screen space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      {showSplash && (
        <SplashScreen
          progress={stats.weightedRate}
          requireLanguageSelect={!localStorage.getItem("language")}
          onLanguageSelect={(lang) => {
            triggerHaptic('light');
            setLanguage(lang);
            localStorage.setItem("language", lang);
            setTimeout(() => {
              setShowSplash(false);
            }, 1200);
          }}
        />
      )}
      
      {/* Sticky card stack — cards peel off and stack below the header as you scroll */}

       {/* Summary Stats - Bold 3D Cards */}
       {/* Each card slot = sentinel (always in DOM) + AnimatePresence card */}
        <motion.div
          animate={{
            y: cardsReachedHeader ? -220 : 0,
            opacity: cardsReachedHeader ? 0 : 1,
          }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
        {/* Card 0: Hero Overall Progress */}
         <AnimatePresence>
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
             whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
                onClick={() => toggleCard(setShowOverallProgress, showOverallProgress)}
                className="group relative w-full cursor-pointer bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[28px] p-5 sm:p-6 text-left shadow-xl shadow-emerald-500/25 border border-white/20 hover:shadow-2xl hover:shadow-emerald-500/40 active:shadow-2xl active:shadow-emerald-500/40 transition-all duration-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -ml-10 -mb-10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="p-2 bg-white/20 rounded-xl">
                  <Target size={28} className="text-white" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    {language === 'en' ? 'Overall Progress' : 'समग्र प्रगति'}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-white/80">
                    {language === 'en' ? 'Department of Roads' : 'सडक विभाग'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{fmt(stats.total)}</div>
                  <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                    {language === 'en' ? 'Indicators' : 'सूचकहरू'}
                  </div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{fmt(reportingOffices.length)}</div>
                  <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                    {language === 'en' ? 'Offices' : 'कार्यालय'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <motion.circle 
                  cx="60" cy="60" r="54" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${2 * Math.PI * 54}` }}
                  animate={{ strokeDasharray: `${2 * Math.PI * 54 * stats.weightedRate / 100} ${2 * Math.PI * 54 * (100 - stats.weightedRate) / 100}` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-white">{fmt(stats.weightedRate)}%</div>
                  <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                    {language === 'en' ? 'Overall' : 'समग्र'}
                  </div>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {showOverallProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="bg-white/10 rounded-xl p-3 space-y-2">
                    <div className="text-[10px] font-black text-white uppercase tracking-wider mb-2">
                      {language === 'en' ? 'Calculation Details' : 'गणना विवरण'}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/70">{language === 'en' ? 'Total Indicators' : 'कुल सूचकहरू'}</span>
                        <span className="font-black text-white">{fmt(stats.total)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/70">{language === 'en' ? 'Total Weight' : 'कुल भार'}</span>
                        <span className="font-black text-white">{fmt(indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100)}%</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/70">{language === 'en' ? 'Achieved Weight' : 'प्राप्त भार'}</span>
                        <span className="font-black text-white">{fmt(Math.round(indicators.reduce((acc, curr) => {
                          if (!curr) return acc;
                          const target = curr.annualTarget || 0;
                          const progress = curr.annualProgress || 0;
                          const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
                          return acc + (achievement * ((curr.weight || 0) / 100));
                        }, 0)))}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.weightedRate}%` }}
                          className="h-full bg-white rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                       <div
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowOverallLogicInline(!showOverallLogicInline);
                         }}
                         role="button"
                         tabIndex={0}
                        className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
                       >
                         <Info size={12} />
                         {language === 'en' ? 'Calculation Logic' : 'गणना विधि'}
                       </div>
                      <AnimatePresence>
                        {showOverallLogicInline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-3 space-y-2"
                          >
                            <div className="bg-white/10 rounded-xl p-3 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                                {language === 'en' ? 'Overall Progress' : 'समग्र प्रगति'}
                              </p>
                              <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                                {language === 'en'
                                  ? 'Strategic weighted average across all indicators.'
                                  : 'सबै सूचकहरूमा रणनीतिक भारित औसत।'}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                                {language === 'en' ? 'Calculation' : 'गणना'}
                              </p>
                              <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                                {language === 'en'
                                  ? 'Formula: Sum of (achievement% × weight/100) for each indicator, divided by total weight.'
                                  : 'सूत्र: प्रत्येक सूचकको लागि (उपलब्धि% × भार/100) को योग, कुल भार ले विभाजित।'}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
        </AnimatePresence>

        {/* Card 1: Status Breakdown */}
          <AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleCard(setShowStatusDetails, showStatusDetails)}
          className="group relative cursor-pointer w-full bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 rounded-[28px] p-5 sm:p-6 text-left shadow-xl shadow-violet-500/25 border border-white/20 hover:shadow-2xl hover:shadow-violet-500/40 active:shadow-2xl active:shadow-violet-500/40 transition-all duration-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">
                {language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण'}
              </span>
              <div className="flex items-center gap-1">
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg">
                  <BarChart3 size={14} className="text-white/90" />
                </span>
                <motion.div animate={{ rotate: showStatusDetails ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/70">
                  <ChevronRight size={18} />
                </motion.div>
              </div>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-white/70 mb-3">
              {language === 'en'
                ? 'Indicators grouped by achievement level'
                : 'उपलब्धि स्तर अनुसार वर्गीकृत सूचकहरू'}
            </div>
            <div className="flex items-end gap-3 mb-3">
               <div>
                 <div className="text-2xl sm:text-3xl font-black text-emerald-200 leading-none">{fmt(stats.meetingTarget)}</div>
                 <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5">
                   {language === 'en' ? 'Meeting Target' : 'लक्ष्य पूरा'}
                 </div>
               </div>
               <div>
                 <div className="text-2xl sm:text-3xl font-black text-amber-200 leading-none">{fmt(stats.belowTarget)}</div>
                 <div className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mt-0.5">
                   {language === 'en' ? 'Below Target' : 'लक्ष्यमुनि'}
                 </div>
               </div>
               <div>
                 <div className="text-2xl sm:text-3xl font-black text-rose-200 leading-none">{fmt(stats.needsCritical)}</div>
                 <div className="text-[10px] font-bold text-rose-200 uppercase tracking-wider mt-0.5">
                   {language === 'en' ? 'Needs Attention' : 'ध्यान'}
                 </div>
               </div>
            </div>

            {/* Stacked mini bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.meetingTarget / stats.total) * 100 : 0}%` }}
                className="h-full bg-emerald-300 rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.belowTarget / stats.total) * 100 : 0}%` }}
                className="h-full bg-amber-300"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (stats.needsCritical / stats.total) * 100 : 0}%` }}
                className="h-full bg-rose-300 rounded-r-full"
              />
            </div>

            <AnimatePresence>
              {showStatusDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="bg-white/10 rounded-xl p-3 space-y-3">
                    {/* Achievement distribution bars */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-200 w-24">
                          {language === 'en' ? 'Meeting Target' : 'लक्ष्य पूरा'}
                        </span>
                        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.total > 0 ? (stats.meetingTarget / stats.total) * 100 : 0}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full bg-emerald-300 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-white w-6 text-right">{fmt(stats.meetingTarget)}</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-200/90 uppercase tracking-wider pl-24 -mt-1 mb-1">
                        {language === 'en' ? 'Achievement rate is 80% or higher' : 'उपलब्धि दर ८०% वा बढी छ'}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-200 w-24">
                          {language === 'en' ? 'Below Target' : 'लक्ष्यमुनि'}
                        </span>
                        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.total > 0 ? (stats.belowTarget / stats.total) * 100 : 0}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full bg-amber-300 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-white w-6 text-right">{fmt(stats.belowTarget)}</span>
                      </div>
                      <p className="text-[10px] text-amber-200 pl-24 -mt-1 mb-1">
                        {language === 'en' ? 'Achievement rate is between 40% and 80%' : 'उपलब्धि दर ४०% र ८०% बीच छ'}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-rose-200 w-24">
                          {language === 'en' ? 'Needs Attention' : 'ध्यान'}
                        </span>
                        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.total > 0 ? (stats.needsCritical / stats.total) * 100 : 0}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full bg-rose-300 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-white w-6 text-right">{fmt(stats.needsCritical)}</span>
                      </div>
                      <p className="text-[10px] text-rose-200 pl-24 -mt-1 mb-1">
                        {language === 'en' ? 'Achievement rate is below 40%' : 'उपलब्धि दर ४०% भन्दा कम छ'}
                      </p>
                    </div>
                  </div>
                   <div className="mt-3 pt-3 border-t border-white/10">
                       <div
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowStatusLogicInline(!showStatusLogicInline);
                         }}
                         role="button"
                         tabIndex={0}
                        className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
                       >
                         <Info size={12} />
                         {language === 'en' ? 'Calculation Logic' : 'गणना विधि'}
                       </div>
                     <AnimatePresence>
                       {showStatusLogicInline && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="overflow-hidden mt-3 space-y-2"
                         >
                           <div className="bg-white/10 rounded-xl p-3 space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                               {language === 'en' ? 'Meeting Target' : 'लक्ष्य पूरा'}
                             </p>
                             <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                               {language === 'en'
                                 ? 'Achievement rate is 80% or higher. Formula: (annualProgress ÷ annualTarget) × 100 ≥ 80%.'
                                 : 'उपलब्धि दर ८०% वा बढी हुन्छ। सूत्र: (वार्षिक प्रगति ÷ वार्षिक लक्ष्य) × 100 ≥ ८०%。'}
                             </p>
                             <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                               {language === 'en' ? 'Below Target' : 'लक्ष्यमुनि'}
                             </p>
                             <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                               {language === 'en'
                                 ? 'Achievement rate is between 40% and 79%. Formula: (annualProgress ÷ annualTarget) × 100 is between 40% and 79%.'
                                 : 'उपलब्धि दर ४०% र ७९% बीच हुन्छ। सूत्र: (वार्षिक प्रगति ÷ वार्षिक लक्ष्य) × 100 बीच ४०% र ७९% मा हुन्छ।'}
                             </p>
                             <p className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                               {language === 'en' ? 'Needs Attention' : 'ध्यान'}
                             </p>
                             <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                               {language === 'en'
                                 ? 'Achievement rate is below 40%. Formula: (annualProgress ÷ annualTarget) × 100 < 40%.'
                                 : 'उपलब्धि दर ४०% भन्दा कम हुन्छ। सूत्र: (वार्षिक प्रगति ÷ वार्षिक लक्ष्य) × 100 < ४०%。'}
                             </p>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.button>
    </AnimatePresence>

        {/* Card 2: Total Indicators */}
          <AnimatePresence>
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleCard(setShowTotalIndicators, showTotalIndicators)}
              className="group relative cursor-pointer w-full bg-gradient-to-br from-indigo-400 via-blue-400 to-cyan-400 rounded-[28px] p-5 sm:p-6 text-left shadow-xl shadow-indigo-500/25 border border-white/20 hover:shadow-2xl hover:shadow-indigo-500/40 active:shadow-2xl active:shadow-indigo-500/40 transition-all duration-200 overflow-hidden"
            >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">
                {language === 'en' ? 'Total Indicators' : 'कुल सूचकहरू'}
              </span>
              <div className="flex items-center gap-1">
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg">
                  <LayoutGrid size={14} className="text-white/90" />
                </span>
                <motion.div animate={{ rotate: showTotalIndicators ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/70">
                  <ChevronRight size={18} />
                </motion.div>
              </div>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-white/70 mb-1">
              {language === 'en' ? 'Total number of indicators being tracked' : 'अनुगमन गरिएका कुल सूचकहरूको संख्या'}
            </div>
              <div className="text-2xl sm:text-3xl font-black text-white mb-4 leading-none">
                {fmt(stats.total)}
              </div>

              <AnimatePresence>
                {showTotalIndicators && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                     <div className="space-y-2.5">
                       {indicators.filter(Boolean).map((ind) => {
                         const pct = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
                         const categoryLabel = language === 'en' ? (ind.category || '').split(' ')[0] : (ind.category || '');
                         const statusLabel = pct >= 80
                           ? (language === 'en' ? 'Meeting Target' : 'लक्ष्य पूरा')
                           : pct >= 40
                           ? (language === 'en' ? 'Below Target' : 'लक्ष्यमुनि')
                           : (language === 'en' ? 'Needs Attention' : 'ध्यान चाहिन्छ');
                         const statusColor = pct >= 80
                           ? 'text-emerald-300'
                           : pct >= 40
                           ? 'text-amber-300'
                           : 'text-rose-300';
                         return (
                           <div key={ind.id} className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-white/80 truncate block">{language === 'en' ? ind.nameEn : ind.name}</span>
                                  <span className="text-[10px] font-black text-emerald-300 shrink-0">{fmt(pct)}%</span>
                                </div>
                                <span className="text-[10px] font-medium text-white/70 truncate block">{categoryLabel}</span>
                                 <span className="text-[10px] font-medium text-white/60 truncate block">{language === 'en' ? 'Weight' : 'भार'}: {fmt(ind.weight)}%</span>
                                 <span className={`text-[10px] font-black truncate block ${statusColor}`}>{statusLabel}</span>
                              </div>
                           </div>
                         );
                       })}
                     </div>
                  </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.button>
    </AnimatePresence>

        {/* Card 3: Category Status */}
          <AnimatePresence>
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleCard(setShowCategoryStatus, showCategoryStatus)}
              className="group relative cursor-pointer w-full bg-gradient-to-br from-teal-400 via-emerald-400 to-green-400 rounded-[28px] p-5 sm:p-6 text-left shadow-xl shadow-teal-500/25 border border-white/20 hover:shadow-2xl hover:shadow-teal-500/40 active:shadow-2xl active:shadow-teal-500/40 transition-all duration-200 overflow-hidden"
            >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">
                {language === 'en' ? 'Category Status' : 'वर्ग स्थिति'}
              </span>
              <div className="flex items-center gap-1">
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg">
                  <LayoutGrid size={14} className="text-white/90" />
                </span>
                <motion.div animate={{ rotate: showCategoryStatus ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/70">
                  <ChevronRight size={18} />
                </motion.div>
              </div>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-white/70 mb-1">
              {language === 'en' ? 'Completion by category' : 'वर्ग अनुसार पूरा प्रतिशत'}
            </div>

             {/* Mini category completion bars - hidden when expanded */}
             <div className={`space-y-2 transition-opacity duration-200 ${showCategoryStatus ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'}`}>
              {STANDARD_CATEGORIES.map((cat) => {
                const catIndicators = indicators.filter((ind) => ind && normalizeCategory(ind.category) === cat);
                const total = catIndicators.length;
                const avgCompletion = total > 0
                  ? Math.round(catIndicators.reduce((sum, ind) => {
                      const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
                      return sum + pct;
                    }, 0) / total)
                  : 0;
                
                if (total === 0) return null;
                
                return (
                   <div key={cat} className="flex items-center gap-2">
                     <div className="w-20 sm:w-24">
                       <span className="text-[10px] font-black uppercase tracking-wider text-white/70 truncate block">
                         {language === 'en' ? (CATEGORY_SHORT_LABELS[cat]?.en || cat.split(' ')[0]) : (CATEGORY_SHORT_LABELS[cat]?.np || cat.split(' ')[0])}
                       </span>
                     </div>
                     <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${avgCompletion}%` }}
                         transition={{ duration: 0.8, ease: 'easeOut' }}
                         className="h-full rounded-full bg-emerald-400"
                       />
                     </div>
                     <span className="text-[10px] font-black text-emerald-300 w-8 text-right">{fmt(avgCompletion)}%</span>
                   </div>
                );
              })}
            </div>

            <AnimatePresence>
              {showCategoryStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="space-y-3">
                    {STANDARD_CATEGORIES.map((cat) => {
                      const catIndicators = indicators.filter((ind) => ind && normalizeCategory(ind.category) === cat);
                      const total = catIndicators.length;
                       const onTrack = catIndicators.filter((ind) => getBreakdownStatus(ind) === 'onTrack').length;
                       const needsAttention = catIndicators.filter((ind) => getBreakdownStatus(ind) === 'needsAttention').length;
                       const color = getCategoryColor(cat).hex;
                      const label = language === 'en' ? (CATEGORY_SHORT_LABELS[cat]?.en || cat.split(' ')[0]) : (CATEGORY_SHORT_LABELS[cat]?.np || cat.split(' ')[0]);
                      const avgCompletion = total > 0
                        ? Math.round(catIndicators.reduce((sum, ind) => {
                            const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0;
                            return sum + pct;
                          }, 0) / total)
                        : 0;

                      if (total === 0) return null;

                      return (
                        <div key={cat} className="bg-white/5 border border-white/10 rounded-xl p-3">
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                  {label}
                                </span>
                                <span className="text-[10px] font-bold text-white/70">
                                  ({fmt(total)})
                                </span>
                              </div>
                             <span className="text-lg font-black text-emerald-300">
                               {fmt(avgCompletion)}%
                             </span>
                           </div>
                           <div className="flex h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                             <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${avgCompletion}%` }} />
                           </div>
                           <div className="flex items-center gap-3">
                             {onTrack > 0 && (
                               <span className="text-[10px] font-bold text-emerald-400">
                                 {fmt(Math.round((onTrack / total) * 100))}% {language === 'en' ? 'On Track' : 'अनुसरण'}
                               </span>
                             )}
                              {needsAttention > 0 && (
                                 <span className="text-[10px] font-bold text-amber-400">
                                   {fmt(Math.round((needsAttention / total) * 100))}% {language === 'en' ? 'Attention' : 'ध्यान'}
                                 </span>
                              )}
                            </div>
                        </div>
                      );
                     })}
                   </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                       <div
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowCategoryLogicInline(!showCategoryLogicInline);
                         }}
                         role="button"
                         tabIndex={0}
                         className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
                       >
                         <Info size={12} />
                         {language === 'en' ? 'Calculation Logic' : 'गणना विधि'}
                       </div>
                      <AnimatePresence>
                        {showCategoryLogicInline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-3 space-y-2"
                          >
                            <div className="bg-white/10 rounded-xl p-3 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                                {language === 'en' ? 'Category Completion' : 'वर्ग पूरा'}
                              </p>
                              <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                                {language === 'en'
                                  ? 'Average achievement percentage for all indicators in each category.'
                                  : 'प्रत्येक वर्गमा सबै सूचकहरूको औसत उपलब्धि प्रतिशत।'}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                                {language === 'en' ? 'Calculation' : 'गणना'}
                              </p>
                              <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                                {language === 'en'
                                  ? 'Formula: Sum of (annualProgress ÷ annualTarget) × 100 for each indicator, divided by total indicators in category.'
                                  : 'सूत्र: प्रत्येक सूचकको लागि (वार्षिक प्रगति ÷ वार्षिक लक्ष्य) × 100 को योग, वर्गमा कुल सूचकहरूको संख्या ले विभाजित।'}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                                {language === 'en' ? 'Status Levels' : 'स्थिति स्तर'}
                              </p>
                              <p className="text-[10px] font-semibold text-white/70 leading-relaxed">
                                {language === 'en'
                                  ? 'Meeting Target: ≥80%. Below Target: 40%-79%. Needs Attention: <40%.'
                                  : 'लक्ष्य पूरा: ≥80%. लक्ष्यमुनि: 40%-79%. ध्यान चाहिन्छ: <40%.'}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                 </motion.div>
              )}
             </AnimatePresence>
            </div>
           </motion.button>
      </AnimatePresence>

        {/* Card 4: Reporting Offices */}
          <AnimatePresence>
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group relative cursor-pointer bg-gradient-to-br from-slate-400 via-gray-400 to-zinc-400 rounded-[28px] shadow-xl shadow-slate-500/25 border border-white/20 hover:shadow-2xl hover:shadow-slate-500/40 active:shadow-2xl active:shadow-slate-500/40 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                  onClick={() => toggleCard(setShowReportingOffices, showReportingOffices)}
                  className="relative w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-white/20 text-white rounded-xl">
                      <Building2 size={14} />
                    </span>
                    <div className="text-left">
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                        {language === 'en' ? 'Reporting Offices' : 'विवरण पठाउने कार्यालयहरू'}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-bold text-white/70">
                        {language === 'en' ? `${reportingOffices.length} offices reporting` : `${reportingOffices.length} कार्यालयहरूबाट रिपोर्टिङ`}
                      </p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: showReportingOffices ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/70">
                    <ChevronRight size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showReportingOffices && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {reportingOffices.map((officeData) => {
                          const displayName = translateOffice(officeData.office);
                          const emails = Array.from(officeData.emails);
                          const adminEmail = emails[0] || '';
                          return (
                            <div key={officeData.office} className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-0.5">
                              <div className="text-[10px] font-black text-white/80 truncate">
                                {displayName}
                              </div>
                              {adminEmail && (
                                <div className="text-[10px] font-bold text-white/60 truncate">
                                  {language === 'en' ? 'Admin: ' : 'एडमिन: '}{adminEmail}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
          </AnimatePresence>
         </motion.div>
      </AnimatePresence>

       {/* Card 5: Budget & Capital Expenditure */}
          <AnimatePresence>
            <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative cursor-pointer bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-[28px] shadow-xl shadow-indigo-500/25 border border-white/20 hover:shadow-2xl hover:shadow-indigo-500/40 active:shadow-2xl active:shadow-indigo-500/40 transition-all duration-200 overflow-hidden"
          >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
              onClick={() => toggleCard(setShowBudgetCard, showBudgetCard)}
          className="relative w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 text-white rounded-xl">
              <Wallet size={14} />
            </span>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                {language === 'en' ? 'Budget & Capital Expenditure' : 'बजेट र पुँजीगत खर्च'}
              </h3>
               <p className="text-[10px] sm:text-[11px] font-bold text-white/70">
                {language === 'en' ? 'Allocation vs expenditure overview' : 'बजेट वितरण र खर्चको अवलोकन'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: showBudgetCard ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/70">
              <ChevronRight size={18} />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {showBudgetCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-emerald-950/20"
            >
              <div className="px-5 pb-5 pt-1 space-y-4">
                 {(() => {
                   const budgetInd = indicators.find(i => i.id === 'ind_14');
                   const capexInd = indicators.find(i => i.id === 'ind_15');
                   if (!budgetInd && !capexInd) {
                     return (
                       <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                         <p className="text-xs text-white/70">
                           {language === 'en' ? 'Budget data not configured' : 'बजेट डाटा कन्फिगर गरिएको छैन'}
                         </p>
                       </div>
                     );
                   }
                   return (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {budgetInd && (() => {
                         const target = budgetInd.annualTarget || 0;
                         const progress = budgetInd.annualProgress || 0;
                         const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
                         const remaining = Math.max(0, target - progress);
                         return (
                           <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                             <div className="flex items-center gap-2 mb-3">
                               <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                 <Wallet size={16} className="text-white" />
                               </div>
                               <div>
                                 <h4 className="text-[11px] font-black text-white uppercase tracking-tight">
                                   {language === 'en' ? budgetInd.nameEn : budgetInd.name}
                                 </h4>
                                 <p className="text-[10px] text-white/70">
                                   {language === 'en' ? 'Total Budget Allocated' : 'कुल बजेट वितरण'}
                                 </p>
                               </div>
                             </div>
                              <div className="flex items-end justify-between mb-2">
                                <div>
                                  <span className="text-2xl font-black text-white leading-none">{fmt(progress)}</span>
                                   <span className="text-[10px] font-bold text-white/60 ml-1">/ {fmt(target)} {translateUnit(budgetInd.unit)}</span>
                                </div>
                                <span className="text-xs font-black text-white">{fmt(pct)}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-white rounded-full"
                                />
                              </div>
                               <div className="flex items-center justify-between mt-2 min-w-0">
                                 <span className="text-[10px] font-bold text-white/60 truncate">
                                    {language === 'en' ? 'Remaining' : 'बाँकी'}: {fmt(remaining)} {translateUnit(budgetInd.unit)}
                                 </span>
                                 <span className="text-[10px] font-bold text-white/60 truncate">
                                   {language === 'en' ? 'Weight' : 'भार'}: {fmt(budgetInd.weight)}%
                                 </span>
                               </div>
                           </div>
                         );
                       })()}
                       {capexInd && (() => {
                         const target = capexInd.annualTarget || 0;
                         const progress = capexInd.annualProgress || 0;
                         const baseline = typeof capexInd.baseline === 'number' ? capexInd.baseline : parseFloat(String(capexInd.baseline || '0'));
                         const baselinePct = baseline > 0 ? Math.round((progress / baseline) * 100) : 0;
                         const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
                         const remaining = Math.max(0, target - progress);
                         return (
                           <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                             <div className="flex items-center gap-2 mb-3">
                               <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                 <PiggyBank size={16} className="text-white" />
                               </div>
                               <div>
                                 <h4 className="text-[11px] font-black text-white uppercase tracking-tight">
                                   {language === 'en' ? capexInd.nameEn : capexInd.name}
                                 </h4>
                                 <p className="text-[10px] text-white/70">
                                   {language === 'en' ? 'Capital Expenditure' : 'पुँजीगत खर्च'}
                                 </p>
                               </div>
                             </div>
                              <div className="flex items-end justify-between mb-2">
                                <div>
                                  <span className="text-2xl font-black text-white leading-none">{fmt(progress)}</span>
                                   <span className="text-[10px] font-bold text-white/60 ml-1">/ {fmt(target)} {translateUnit(capexInd.unit)}</span>
                                </div>
                                <span className="text-xs font-black text-white">{fmt(pct)}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-white rounded-full"
                                />
                              </div>
                               <div className="flex items-center justify-between mt-2 min-w-0">
                                 <span className="text-[10px] font-bold text-white/60 truncate">
                                   {language === 'en' ? 'Baseline' : 'आधारभूत'}: {fmt(baseline)}%
                                 </span>
                                 <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                  progress >= baseline
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}>
                                  {progress >= baseline ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                  {fmt(baselinePct)}% {language === 'en' ? 'of baseline' : 'आधारभूत'}
                               </span>
                             </div>
                           </div>
                        );
                      })()}
                    </div>
                      );
                    })}
                  </div>
                   <div className="mt-3 pt-3 border-t border-white/10">
                   <div
                     onClick={(e) => {
                       e.stopPropagation();
                       closeAllCards();
                       setShowProgressLogic(true);
                     }}
                     role="button"
                     tabIndex={0}
                       className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
                     >
                       <Info size={12} />
                       {language === 'en' ? 'Calculation Logic' : 'गणना विधि'}
                   </div>
                  </div>
                </motion.div>
              )}
             </AnimatePresence>
       </motion.div>
      </AnimatePresence>

       {/* Card 6: Visual Insights */}
          <AnimatePresence>
            <motion.div
            ref={insightsCardRef}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10 active:shadow-2xl active:shadow-indigo-500/20 dark:active:shadow-indigo-500/10 transition-all duration-200 overflow-hidden"
          >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {highlightedCard === 'insights' && (
          <div className="absolute inset-0 rounded-[28px] ring-4 ring-indigo-500/60 animate-pulse pointer-events-none z-20" />
        )}
        <button
              onClick={() => toggleCard(setShowInsights, showInsights)}
          className="relative w-full flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-slate-900 hover:from-indigo-50 dark:hover:from-indigo-950/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500 text-white rounded-xl">
              <BarChart3 size={14} />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {language === 'en' ? 'Visual Insights' : 'दृश्यात्मक अन्तर्दृष्टि'}
              </h3>
               <p className="text-[10px] font-bold text-slate-600 dark:text-white/70">
                {language === 'en' ? 'Optional charts & analytics' : 'वैकल्पिक चार्ट र विश्लेषण'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: showInsights ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-slate-500 dark:text-white/70">
              <ChevronRight size={18} />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {showInsights && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden bg-slate-900 dark:bg-indigo-950/30"
              >
                <div className="px-5 pb-5 pt-1 space-y-4 relative">
                  {highlightedCard === 'insights' && (
                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none rounded-lg" />
                  )}
                  {/* Chart type options */}
                 <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setInsightTab('health')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                          insightTab === 'health' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <PieChartIcon size={12} />
                        {language === 'en' ? 'Health' : 'पोर्टफोलियो'}
                      </button>
                      <button
                        onClick={() => setInsightTab('category')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                          insightTab === 'category' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <LayoutGrid size={12} />
                        {language === 'en' ? 'Category' : 'वर्ग'}
                      </button>
                      <button
                        onClick={() => setInsightTab('indicators')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                          insightTab === 'indicators' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <BarChart3 size={12} />
                        {language === 'en' ? 'Indicators' : 'सूचकहरू'}
                      </button>
                      <button
                        onClick={() => setInsightTab('trends')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                          insightTab === 'trends' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <LineChartIcon size={12} />
                        {language === 'en' ? 'Trends' : 'प्रवृत्तिहरू'}
                      </button>
                      <button
                        onClick={() => setInsightTab('heatmap')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                          insightTab === 'heatmap' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <Activity size={12} />
                        {language === 'en' ? 'Heatmap' : 'हिटम्याप'}
                      </button>
                    </div>

                   {insightTab === 'health' && (
                     <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
                       <button
                         onClick={() => setPortfolioMode('bar')}
                         className={`p-1.5 rounded-lg transition-all ${portfolioMode === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
                         title={language === 'en' ? 'Bar' : 'बार'}
                       >
                         <BarChart3 size={12} />
                       </button>
                       <button
                         onClick={() => setPortfolioMode('pie')}
                         className={`p-1.5 rounded-lg transition-all ${portfolioMode === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
                         title={language === 'en' ? 'Pie' : 'पाई'}
                       >
                         <PieChartIcon size={12} />
                       </button>
                     </div>
                   )}
                 </div>

                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[320px]">
                  {insightTab === 'health' && (
                    <PortfolioHealthChart indicators={indicators} t={t} mode={portfolioMode} />
                  )}
                  {insightTab === 'category' && <CategoryInsightsChart indicators={indicators} t={t} language={language} />}
                  {insightTab === 'indicators' && <MetricsChart indicators={indicators} />}
                  {insightTab === 'trends' && <TrendAnalysisView indicators={indicators} metadata={metadata} onOpenAbout={onOpenAbout} />}
                  {insightTab === 'heatmap' && <IndicatorHeatmap indicators={indicators} updatesHistory={updatesHistory} />}
                </div>
              </div>
            </motion.div>
          )}
         </AnimatePresence>
       </motion.div>
      </AnimatePresence>

       {/* Card 7: All Indicators Overview */}
          <AnimatePresence>
           <motion.div
             ref={lastCardRef}
             layout
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
             transition={{ duration: 0.3, ease: 'easeInOut' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative cursor-pointer bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-[28px] shadow-xl shadow-indigo-500/30 border border-white/30 hover:shadow-2xl hover:shadow-indigo-500/50 active:shadow-2xl active:shadow-indigo-500/50 transition-all duration-200 overflow-hidden"
           >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
              onClick={() => toggleCard(setShowAllIndicators, showAllIndicators)}
          className="relative w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-5 sm:py-6"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl">
              <LayoutGrid size={18} className="text-white" />
            </span>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {language === 'en' ? 'All Indicators' : 'सबै सूचकहरू'}
              </h3>
               <p className="text-[10px] sm:text-xs font-bold text-white/80">
                {language === 'en' ? `${indicators.length} indicators tracked — click to explore` : `${indicators.length} सूचकहरू ट्र्याक गरिएको — अन्वेषणका लागि क्लिक गर्नुहोस्`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ rotate: showAllIndicators ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-white/90">
              <ChevronRight size={20} />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {showAllIndicators && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden bg-white/10"
            >
               <div className="px-5 sm:px-6 pb-5 pt-3 space-y-4">
                  {/* Filters */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div>
                        <span className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                          {language === 'en' ? 'Sort By' : 'क्रमबद्ध गर्नुहोस्'}
                        </span>
                        <select
                          value={sortType}
                          onChange={(e) => setSortType(e.target.value as any)}
                          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white focus:outline-none focus:border-white/30 cursor-pointer"
                        >
                          <option value="default">{language === 'en' ? 'Default' : 'पूर्वावस्थानुसार'}</option>
                          <option value="low">{language === 'en' ? 'Low to High' : 'कमदेखि बढी'}</option>
                          <option value="high">{language === 'en' ? 'High to Low' : 'बढीदेखि कम'}</option>
                          <option value="weight">{language === 'en' ? 'By Weight' : 'भार अनुसार'}</option>
                          <option value="status">{language === 'en' ? 'By Status' : 'स्थिति अनुसार'}</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                          {language === 'en' ? 'Category' : 'वर्ग'}
                        </span>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white focus:outline-none focus:border-white/30 cursor-pointer"
                        >
                          <option value="All">{language === 'en' ? 'All Categories' : 'सबै वर्गहरू'}</option>
                          {STANDARD_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{language === 'en' ? cat.split(' ')[0] : cat.split(' ')[0]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                {/* Indicator Grid */}
                {filteredIndicators.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-3 bg-white/5 inline-block rounded-full mb-3">
                      <Filter className="text-white/40" size={24} />
                    </div>
                    <h3 className="text-white font-bold text-sm">
                      {language === 'en' ? 'No indicators found' : 'कुनै सूचकहरू फेला परेनन्'}
                    </h3>
                     <p className="text-[0.6875rem] text-white/60 mt-1">
                      {language === 'en' ? 'Try adjusting your category filter' : 'वर्ग फिल्टर परिवर्तन गर्नुहोस्'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 mt-3">
                    <AnimatePresence mode="popLayout">
                      {filteredIndicators.map((ind, idx) => {
                        if (!ind) return null;
                        const pct = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
                        const status = getStatusBadge(pct, t);
                        const sparkline = getSparklineData(ind.id, ind.annualProgress, ind.annualTarget, metadata?.lastUpdateDate);
                        const isExpanded = expandedId === ind.id;

                        return (
                          <SummaryCard
                            key={ind.id}
                            indicator={ind}
                            language={language}
                            isExpanded={isExpanded}
                            onToggle={() => handleToggleExpand(ind.id)}
                            onClick={() => handleIndicatorAction(ind, 'click')}
                            sparklineData={sparkline}
                            status={status}
                            progressPercent={pct}
                            isAdmin={isAdmin}
                            onViewHistory={(ind) => handleIndicatorAction(ind, 'history')}
                            onOpenComments={(ind) => handleIndicatorAction(ind, 'comments')}
                            index={idx}
                            translateUnit={translateUnit}
                            addToast={addToast}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
             </motion.div>
           )}
           </AnimatePresence>
         </motion.div>
       </AnimatePresence>
       </motion.div>

      <StatusBreakdownModal
        isOpen={showStatusBreakdown}
        onClose={() => setShowStatusBreakdown(false)}
        indicators={indicators}
        language={language}
        onSelectIndicator={onSelectIndicatorFromBreakdown}
      />

      <IndicatorsBreakdownModal
        isOpen={showIndicatorsBreakdown}
        onClose={() => setShowIndicatorsBreakdown(false)}
        indicators={indicators}
        language={language}
      />

      {showProgressLogic && (
        <ProgressLogicModal
          isOpen={showProgressLogic}
          onClose={() => setShowProgressLogic(false)}
          indicators={indicators}
          language={language}
        />
      )}

       <AnimatePresence>
         {showOfficeLogicInfo && (
           <div key="office-logic" className="absolute inset-0 z-[550] flex items-center justify-center p-4" onClick={() => setShowOfficeLogicInfo(false)}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden max-h-[80dvh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'en' ? 'Office Score Logic' : 'कार्यालय स्कोर विधि'}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'en' ? 'How individual office % is calculated' : 'व्यक्तिगत कार्यालय % कसरी गणना गरिन्छ'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowOfficeLogicInfo(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-start gap-3 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm shrink-0">
                    <Calculator size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'en' ? 'Formula' : 'सूत्र'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'Each office’s score is calculated from the Offices sheet. For every numeric indicator column, the system computes: (office value ÷ total value) × 100. The office % shown is the average of these column-wise completion percentages.'
                        : 'प्रत्येक कार्यालयको स्कोर कार्यालय शीटबाट गणना गरिन्छ। सबै संख्यात्मक सूचक स्तम्भहरूको लागि प्रणालीले गणना गर्दछ: (कार्यालय मान ÷ कुल मान) × 100। देखाइएको कार्यालय % यी स्तम्भ-आधारित पूरा हुने प्रतिशतहरूको औसत हो।'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm shrink-0">
                    <Database size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'en' ? 'Baseline' : 'आधाररेखा'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'The Total row from the Offices sheet is used as the baseline. If an office has no indicator data yet, it is shown as “—” instead of 0%.'
                        : 'कार्यालय शीटको कुल पङ्क्तिलाई आधाररेखा रूपमा प्रयोग गरिन्छ। यदि कार्यालयलाई अझै सूचक तथ्याङ्क छैन भने ०% को सट्टा “—” देखाइन्छ।'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       <SystemHelpModal
        isOpen={showSystemHelpModal}
        onClose={() => setShowSystemHelpModal(false)}
        indicators={indicators}
        offices={offices}
        defaultTab="indicators"
      />
    </div>
  );
};
