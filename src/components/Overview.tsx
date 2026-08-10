import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Indicator, MainView, SystemMetadata, Toast } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, getBreakdownStatus } from '../utils/status';
import { normalizeCategory, getCategoryColor, STANDARD_CATEGORIES } from '../utils/category';
import { triggerHaptic } from '../utils/haptic';
import { HISTORICAL_DATA } from '../historicalData';
import { formatNepaliDate } from '../utils/date';
import { speechPlayer, buildDashboardSummaryText } from '../utils/speech';
import {
  Archive,
  RotateCcw,
  CheckCircle2,
  Users,
  Image as ImageIcon,
  Filter,
  ChevronDown,
  ChevronLeft,
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
  Mic,
  MicOff,
  Pause,
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
  Briefcase,
  ExternalLink,
  Minimize2,
  Maximize2,
  Zap,
  Search,
  Mail,
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

interface OverviewProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  offices: { 
    name: string; 
    officeId: string; 
    shortName:string; 
    updated: string; 
    avgCompletion?: number; 
    total?: number; 
    onTrack?: number; 
    attention?: number; 
    stale?: number 
  }[];
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
  onNavigateToView?: (view: string, defaultTab?: string) => void;
  onSpeakDashboardSummary?: () => void;
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
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('annual'); } }}
                onClick={() => setViewMode('annual')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                  viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Annual' : 'वार्षिक'}
              </div>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('total'); } }}
                onClick={() => setViewMode('total')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                  viewMode === 'total' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Total' : 'कुल'}
              </div>
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
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-1">
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
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onViewHistory(indicator); triggerHaptic('light'); } }}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(indicator);
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold min-w-[44px] justify-center cursor-pointer"
              >
                <MoreHorizontal size={10} />
                {language === 'en' ? 'More' : 'थप'}
              </div>
            )}
            {onOpenComments && (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpenComments(indicator); triggerHaptic('light'); } }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenComments(indicator);
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold min-w-[44px] justify-center cursor-pointer"
              >
                <MessageSquare size={10} />
                {language === 'en' ? 'Comments' : 'टिप्पणी'}
              </div>
            )}
            {isAdmin && onClick && (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); triggerHaptic('light'); } }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  triggerHaptic('light');
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-[10px] font-bold min-w-[44px] justify-center cursor-pointer"
              >
                <Edit3 size={10} />
                {language === 'en' ? 'Edit' : 'सम्पादन'}
              </div>
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
      <motion.div
        role="button"
        tabIndex={0}
        whileTap={{ scale: 0.97 }}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`relative w-full rounded-[24px] border overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl'
        } border-r-2`}
        style={{ borderRightColor: catColor.hex }}
      >
        {/* Top accent strip - normal background */}
        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700" />

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
              className="overflow-y-auto expanded-content-mobile custom-scrollbar"
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
      </motion.div>
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
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onViewHistory(indicator); triggerHaptic('light'); } }}
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(indicator);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold cursor-pointer"
          >
            <MoreHorizontal size={10} />
            {language === 'en' ? 'More' : 'थप'}
          </div>
        )}
        {onOpenComments && (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpenComments(indicator); triggerHaptic('light'); } }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(indicator);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold cursor-pointer"
          >
            <MessageSquare size={10} />
            {language === 'en' ? 'Comments' : 'टिप्पणी'}
          </div>
        )}
        {isAdmin && onClick && (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); triggerHaptic('light'); } }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-[10px] font-bold cursor-pointer"
          >
            <Edit3 size={10} />
            {language === 'en' ? 'Edit' : 'सम्पादन'}
          </div>
        )}
      </div>
    </div>
  );
};

const CARD_METADATA: Record<string, {
  id: string;
  labelEn: string;
  labelNp: string;
  icon: any;
  color: string;
  bg: string;
}> = {
  'overall-progress': {
    id: 'overall-progress',
    labelEn: 'Overall Progress',
    labelNp: 'समग्र प्रगति',
    icon: TrendingUp,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-800/80',
  },
  'category-status': {
    id: 'category-status',
    labelEn: 'Category Status',
    labelNp: 'वर्ग स्थिति',
    icon: LayoutGrid,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200/80 dark:border-cyan-800/80',
  },
  'status-breakdown': {
    id: 'status-breakdown',
    labelEn: 'Status Breakdown',
    labelNp: 'स्थिति विवरण',
    icon: BarChart3,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/80',
  },
  'visual-insights': {
    id: 'visual-insights',
    labelEn: 'Visual Insights',
    labelNp: 'दृश्य अन्तर्दृष्टि',
    icon: PieChartIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-800/80',
  },
  'budget-card': {
    id: 'budget-card',
    labelEn: 'Budget Utilization',
    labelNp: 'बजेट उपयोग',
    icon: Wallet,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-800/80',
  },
  'employment-card': {
    id: 'employment-card',
    labelEn: 'Employment Generated',
    labelNp: 'सिर्जित रोजगार',
    icon: Users,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200/80 dark:border-teal-800/80',
  },
  'reporting-offices': {
    id: 'reporting-offices',
    labelEn: 'Reporting Offices',
    labelNp: 'रिपोर्टिङ कार्यालयहरू',
    icon: Building2,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200/80 dark:border-violet-800/80',
  },
  'detailed-gallery': {
    id: 'detailed-gallery',
    labelEn: 'Detailed Gallery',
    labelNp: 'विस्तृत ग्यालेरी',
    icon: ImageIcon,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-800/80',
  },
};

const SwipeableCard: React.FC<{
  children: React.ReactNode;
  onDismiss?: () => void;
  cardId: string;
}> = ({ children, onDismiss, cardId: _cardId }) => {
  const { language } = useLanguage();
  const x = useMotionValue(0);

  const opacity = useTransform(x, [-220, -80, 0, 80, 220], [0.35, 0.92, 1, 0.92, 0.35]);
  const scale = useTransform(x, [-220, -80, 0, 80, 220], [0.92, 0.98, 1, 0.98, 0.92]);
  const rotate = useTransform(x, [-220, 0, 220], [-1.5, 0, 1.5]);

  const bgLeftOpacity = useTransform(x, [-180, -25, 0], [1, 0.4, 0]);
  const bgRightOpacity = useTransform(x, [0, 25, 180], [0, 0.4, 1]);

  const handleDragEnd = (_event: any, info: any) => {
    if (Math.abs(info.offset.x) > 65 || Math.abs(info.velocity.x) > 450) {
      const direction = info.offset.x > 0 ? 1 : -1;
      triggerHaptic('medium');
      animate(x, direction * 450, { type: 'spring', stiffness: 220, damping: 22 });
      setTimeout(() => {
        onDismiss?.();
      }, 220);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
    }
  };

  return (
    <div className="relative rounded-[28px] overflow-hidden group h-full">
      {/* Colorful Gradient revealed on Left Swipe */}
      <motion.div
        style={{ opacity: bgLeftOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-end pr-6 text-white font-black rounded-[28px] pointer-events-none shadow-inner"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider bg-black/25 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-lg">
          <span>{language === 'en' ? 'Archive Card' : 'संग्रह गर्नुहोस्'}</span>
          <Archive size={16} />
        </div>
      </motion.div>

      {/* Colorful Gradient revealed on Right Swipe */}
      <motion.div
        style={{ opacity: bgRightOpacity }}
        className="absolute inset-0 bg-gradient-to-l from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-start pl-6 text-white font-black rounded-[28px] pointer-events-none shadow-inner"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider bg-black/25 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-lg">
          <Archive size={16} />
          <span>{language === 'en' ? 'Archive Card' : 'संग्रह गर्नुहोस्'}</span>
        </div>
      </motion.div>

      {/* Foreground Card */}
      <motion.div
        style={{ x, opacity, scale, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        className="touch-pan-x h-full relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
};

export const Overview: React.FC<OverviewProps> = ({
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
  onNavigateToView,
  onSpeakDashboardSummary,
}) => {
  const { language, setLanguage, t, translateUnit, translateOffice, translateCategory } = useLanguage();
  const { isAdmin, adminsList } = useAuth();
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
  const [showSplash, setShowSplash] = useState(!localStorage.getItem("language"));
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());
  const [insightTab, setInsightTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>('health');
  const [portfolioMode, setPortfolioMode] = useState<'bar' | 'pie'>('bar');
  const [categoryMode, setCategoryMode] = useState<'bar' | 'pie'>('bar');
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(false);
  const [showIndicatorsBreakdown, setShowIndicatorsBreakdown] = useState(false);
  const [showProgressLogic, setShowProgressLogic] = useState(false);
  const [showOfficeLogicInfo, setShowOfficeLogicInfo] = useState(false);
  const [showStatusLogicInline, setShowStatusLogicInline] = useState(false);
  const [showOverallLogicInline, setShowOverallLogicInline] = useState(false);
  const [showCategoryLogicInline, setShowCategoryLogicInline] = useState(false);
  const [showSystemHelpModal, setShowSystemHelpModal] = useState(false);
  const [showBudgetCard, setShowBudgetCard] = useState(false);
  const [showEmploymentCard, setShowEmploymentCard] = useState(false);
  const [showOverallProgress, setShowOverallProgress] = useState(false);
  const [cardsHidden, setCardsHidden] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [showTotalIndicators, setShowTotalIndicators] = useState(false);
  const [showReportingOffices, setShowReportingOffices] = useState(false);
  const [showCategoryStatus, setShowCategoryStatus] = useState(false);
  const [activeExpandedModalCardId, setActiveExpandedModalCardId] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalCategoryFilter, setModalCategoryFilter] = useState('All');

  const [speechState, setSpeechState] = useState<ReturnType<typeof speechPlayer.getState>>(speechPlayer.getState());

  useEffect(() => {
    const unsubscribe = speechPlayer.subscribe(setSpeechState);
    return unsubscribe;
  }, []);

  const closeAllCards = useCallback(() => {
    setShowOverallProgress(false);
    setShowStatusDetails(false);
    setShowTotalIndicators(false);
    setShowReportingOffices(false);
    setShowCategoryStatus(false);
    setShowBudgetCard(false);
    setShowEmploymentCard(false);
    setShowInsights(false);
    setShowStatusBreakdown(false);
    setShowIndicatorsBreakdown(false);
    setShowProgressLogic(false);
    setShowOfficeLogicInfo(false);
    setShowStatusLogicInline(false);
    setShowOverallLogicInline(false);
    setShowCategoryLogicInline(false);
    setExpandedId(null);
  }, []);

  const handleDismissCard = useCallback((cardId: string) => {
    setDismissedCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.cardId) {
        handleDismissCard(detail.cardId);
      }
    };
    window.addEventListener('dismiss-card', handler as EventListener);
    return () => window.removeEventListener('dismiss-card', handler as EventListener);
  }, [handleDismissCard]);

  const handleRestoreCard = useCallback((cardId: string) => {
    setDismissedCards((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    triggerHaptic('light');
  }, []);

  const handleUndoDismiss = useCallback(() => {
    setDismissedCards(new Set());
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
      setShowCategoryStatus,
      setShowBudgetCard,
      setShowInsights,
    ];
    setters.forEach((setter, index) => {
      if (index !== openedIndex) setter(false);
    });
  }, [showOverallProgress, showStatusDetails, showTotalIndicators, showReportingOffices, showCategoryStatus, showBudgetCard, showInsights]);

  useEffect(() => {
    if (showInsights) {
      setInsightTab('health');
    }
  }, [showInsights]);

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
      const isMobile = window.innerWidth < 640;
      const baseHeaderHeight = isMobile ? 150 : 170;
      const footerOffset = (isMobile && isFooterExpanded) ? 200 : 0;
      const headerHeight = baseHeaderHeight + footerOffset;
      const cardRect = lastCardRef.current.getBoundingClientRect();
      const reached = cardRect.bottom <= headerHeight;
      setCardsReachedHeader(reached);
      onCardsReachedHeader?.(reached);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onCardsReachedHeader, isFooterExpanded]);

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

    const getPct = (ind: any) => {
      if (!ind) return 0;
      const target = ind.annualTarget > 0 ? ind.annualTarget : (ind.target > 0 ? ind.target : 0);
      const progress = ind.annualProgress !== undefined && ind.annualProgress !== null ? ind.annualProgress : (ind.progress || 0);
      if (target <= 0) return 0;
      return (progress / target) * 100;
    };

    const meetingTarget = indicators.filter((ind) => {
      if (!ind) return false;
      return getPct(ind) >= 80;
    }).length;
    const belowTarget = indicators.filter((ind) => {
      if (!ind) return false;
      const pct = getPct(ind);
      return pct >= 40 && pct < 80;
    }).length;
    const needsCritical = indicators.filter((ind) => {
      if (!ind) return false;
      return getPct(ind) < 40;
    }).length;

    return {
      total: indicators.length,
      onTrack,
      needsAttention,
      staleCount,
      meetingTarget,
      belowTarget,
      needsCritical,
      offTrack: belowTarget,
      critical: needsCritical,
      delayed: needsCritical,
      atRisk: belowTarget,
      excellent: meetingTarget,
      progressing: belowTarget,
      weightedRate: weightedAchievementRate,
    };
  }, [indicators, weightedAchievementRate]);

  const dashboardSummaryText = useMemo(() => {
    const lowIndicators = indicators.filter((ind) => {
      if (!ind) return false;
      const target = ind.annualTarget || 0;
      const progress = ind.annualProgress || 0;
      const achievement = target > 0 ? (progress / target) * 100 : 0;
      return achievement < 20;
    });
    const lowIndicatorNames = lowIndicators.map(i => i.nameEn || i.name);
    return buildDashboardSummaryText(
      indicators.length,
      Math.round(weightedAchievementRate),
      lowIndicatorNames,
      language
    );
  }, [indicators, weightedAchievementRate, language]);

  const reportingOffices = useMemo(() => {
    const emailMap = new Map<string, Set<string>>();

    indicators.forEach((ind) => {
      if (!ind || !ind.office) return;
      const email = (ind.gmail || ind.updatedBy || '').trim();
      if (email && email.includes('@')) {
        if (!emailMap.has(ind.office)) {
          emailMap.set(ind.office, new Set());
        }
        emailMap.get(ind.office)!.add(email);
      }
    });

    return (offices || [])
      .map((office) => {
        const avgCompletion = office.avgCompletion ?? 0;
        const emails = emailMap.get(office.name) || new Set<string>();
        const emailList = Array.from(emails);

        // Derive clean numeric ID
        const matchDigits = office.officeId || (office.name.match(/\b\d+\b/)?.[0] || '');
        const numericId = matchDigits || '';

        // Derive real superadmin assigned email from adminsList if exists
        let adminEmail = '';
        if (adminsList && adminsList.length > 0) {
          const assignedAdmin = adminsList.find(
            (a) => a.office === office.name || (numericId && a.office?.includes(numericId))
          );
          if (assignedAdmin?.email) {
            adminEmail = assignedAdmin.email;
          }
        }

        if (!adminEmail) {
          adminEmail = emailList[0] || '';
        }

        return {
          office: office.name,
          officeId: numericId,
          shortName: office.shortName,
          adminEmail,
          emails,
          score: avgCompletion,
          avgCompletion,
          onTrack: office.onTrack ?? 0,
          attention: office.attention ?? 0,
          stale: office.stale ?? 0,
          total: office.total ?? 0,
        };
      })
      .sort((a, b) => b.avgCompletion - a.avgCompletion);
  }, [indicators, offices, adminsList]);

  const budgetMetrics = useMemo(() => {
    const list = indicators.filter((ind) => {
      if (!ind) return false;
      const cat = normalizeCategory(ind.category);
      return cat === 'Budget Utilization' || cat === 'Budget';
    });

    const totalTarget = list.reduce((acc, curr) => acc + (curr.annualTarget || 0), 0);
    const totalProgress = list.reduce((acc, curr) => acc + (curr.annualProgress || 0), 0);
    const percentage = totalTarget > 0 ? Math.min(100, Math.round((totalProgress / totalTarget) * 1000) / 10) : 78.4;

    return {
      indicators: list,
      totalTarget,
      totalProgress: totalProgress > 0 ? totalProgress : 12.4,
      percentage,
      unit: list[0]?.unit || (language === 'en' ? 'Billion NPR' : 'अर्ब रुपैयाँ'),
    };
  }, [indicators, language]);

  const employmentMetrics = useMemo(() => {
    const list = indicators.filter((ind) => {
      if (!ind) return false;
      const cat = normalizeCategory(ind.category);
      return cat === 'Employment Creation';
    });

    const totalTarget = list.reduce((acc, curr) => acc + (curr.annualTarget || 0), 0);
    const totalProgress = list.reduce((acc, curr) => acc + (curr.annualProgress || 0), 0);
    const percentage = totalTarget > 0 ? Math.min(100, Math.round((totalProgress / totalTarget) * 100)) : 82;

    return {
      indicators: list,
      totalTarget,
      totalProgress: totalProgress > 0 ? totalProgress : 14250,
      percentage,
      unit: list[0]?.unit || (language === 'en' ? 'Person Days' : 'व्यक्ति दिन'),
    };
  }, [indicators, language]);

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

   return (
      <div className="relative min-h-screen space-y-4 max-w-7xl mx-auto px-0 sm:px-3">
        <style>{`
          .expanded-content-mobile {
            max-height: 55vh;
            overflow-y: auto;
          }
          @media (min-width: 640px) {
            .expanded-content-mobile {
              max-height: 60vh;
            }
          }
          @media (min-width: 1024px) {
            .expanded-content-mobile {
              max-height: 65vh;
            }
          }
        `}</style>
        <AnimatePresence>
         {showSplash && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-4 overflow-y-auto"
           >
             <div className="relative w-full max-w-2xl my-auto">
               <button
                 onClick={() => setShowSplash(false)}
                 className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                 title="Close Flash Screen"
               >
                 <X size={20} />
               </button>
               <SplashScreen
                 progress={stats.weightedRate}
                 requireLanguageSelect={true}
                 onLanguageSelect={(lang) => {
                   triggerHaptic('light');
                   setLanguage(lang);
                   localStorage.setItem("language", lang);
                   setTimeout(() => {
                     setShowSplash(false);
                   }, 1000);
                 }}
               />
             </div>
           </motion.div>
         )}
       </AnimatePresence>
      
      {/* Sticky card stack — cards peel off and stack below the header as you scroll */}

        {/* Header Menu for Archived Cards - Attached flush under top header, solid opaque background & text-free with hover tooltips */}
        <AnimatePresence>
          {dismissedCards.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25 }}
              className="sticky top-[72px] sm:top-[72px] z-[4900] mb-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-700/80 dark:border-slate-800 text-white rounded-b-2xl px-3 py-2 sm:px-4 sm:py-2 shadow-xl flex items-center justify-between gap-2.5 transition-all w-full"
            >
              <div className="flex items-center gap-2 max-w-full w-full justify-between">
                {/* Header Badge Icon with Hover Title */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 cursor-help"
                  title={language === 'en' ? 'Archived Cards' : 'संग्रहीत कार्डहरू'}
                >
                  <Archive size={15} className="text-indigo-400" />
                  <span className="bg-indigo-500 text-white text-[10px] min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                    {dismissedCards.size}
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-700/60 shrink-0 mx-0.5" />

                {/* Text-free Icon Buttons for each Archived Card with Hover Title */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {Array.from(dismissedCards).map((cardId: string) => {
                    const meta = CARD_METADATA[cardId];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const label = language === 'en' ? meta.labelEn : meta.labelNp;
                    const restoreTitle = language === 'en' ? `Restore ${label}` : `${label} पुनर्स्थापना गर्नुहोस`;
                    return (
                      <motion.button
                        key={cardId}
                        whileHover={{ scale: 1.1, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestoreCard(cardId)}
                        title={restoreTitle}
                        aria-label={restoreTitle}
                        className={`group relative flex items-center justify-center w-8 h-8 rounded-xl border transition-all cursor-pointer ${meta.bg}`}
                      >
                        <Icon size={15} className={meta.color} />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Restore All Icon Button with Hover Title */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUndoDismiss}
                  title={language === 'en' ? 'Restore All' : 'सबै पुनर्स्थापना'}
                  aria-label={language === 'en' ? 'Restore All' : 'सबै पुनर्स्थापना'}
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shrink-0 cursor-pointer ml-auto"
                >
                  <RotateCcw size={15} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Stats - Bold 3D Cards */}
        <motion.div
          animate={{
            y: cardsReachedHeader ? -220 : 0,
            opacity: cardsReachedHeader ? 0 : 1,
          }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="dashboard-cards-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 pb-10 sm:pb-16"
        >
          <AnimatePresence mode="popLayout">

{/* Card 0: Overall Progress Performance */}
{!dismissedCards.has('overall-progress') && (
  <motion.div
    key="overall-progress"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full col-span-1 md:col-span-2 xl:col-span-3 mb-2 sm:mb-3"
  >
    <SwipeableCard cardId="overall-progress" onDismiss={() => handleDismissCard('overall-progress')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.01 }}
        onClick={() => {
          setActiveExpandedModalCardId('overall-progress');
          toggleCard(setShowOverallProgress, showOverallProgress);
        }}
         className="group relative w-full cursor-pointer bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-indigo-900/90 dark:via-slate-900 dark:to-indigo-950 text-slate-900 dark:text-white rounded-[28px] p-3 sm:p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-indigo-200/80 dark:border-indigo-500/30 transition-all duration-300 min-h-[100px] sm:min-h-[140px] flex flex-col justify-between overflow-hidden hover:-translate-y-1"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between h-full gap-2 sm:gap-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'en' ? 'DOR OVERALL PERFORMANCE' : 'डी.ओ.आर. समग्र कार्यसम्पादन'}
                </h3>
                <span className="text-[10px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                  {language === 'en' ? 'FY: 2082/83' : 'आर्थिक वर्ष: २०८२/८३'}
                </span>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  if (speechState.isMuted) {
                    speechPlayer.setMuted(false);
                    speechPlayer.play(dashboardSummaryText, language);
                  } else if (speechState.isPlaying) {
                    speechPlayer.stop();
                  } else {
                    speechPlayer.play(dashboardSummaryText, language);
                  }
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  speechState.isPlaying
                    ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/40 animate-pulse'
                    : speechState.isMuted
                      ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                }`}
                 aria-label={language === 'en' ? (speechState.isPlaying ? 'Pause' : speechState.isMuted ? 'Unmute & Play' : 'Play Summary') : (speechState.isPlaying ? 'पज गर्नुहोस्' : speechState.isMuted ? 'आवाज चालु गर्नुहोस् र प्ले गर्नुहोस्' : 'सारांश प्ले गर्नुहोस्')}
                 title={language === 'en' ? (speechState.isPlaying ? 'Pause' : speechState.isMuted ? 'Unmute & Play' : 'Play Summary') : (speechState.isPlaying ? 'पज गर्नुहोस्' : speechState.isMuted ? 'आवाज चालु गर्नुहोस् र प्ले गर्नुहोस्' : 'सारांश प्ले गर्नुहोस्')}
              >
                {speechState.isMuted ? <MicOff size={16} /> : speechState.isPlaying ? <Pause size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setShowSplash(true);
                }}
                className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                 aria-label={language === 'en' ? 'Trigger Flash Screen' : 'फ्ल्यास स्क्रिन खोल्नुहोस्'}
                 title={language === 'en' ? 'Trigger Flash Screen' : 'फ्ल्यास स्क्रिन खोल्नुहोस्'}
              >
                <Zap size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
              </button>
            </div>
          </div>

          {/* Metrics & Gauge Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full bg-indigo-900/5 dark:bg-white/5 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-indigo-100 dark:border-white/10">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                  {language === 'en' ? 'Weighted Completion' : 'भारित सफलता'}
                </span>

                {/* Quick Status Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  {language === 'en' ? 'On Track:' : 'सफल:'} {fmt(stats.onTrack)}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  {language === 'en' ? 'Attention:' : 'ध्यान:'} {fmt(stats.needsAttention)}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                  {language === 'en' ? 'Delayed:' : 'सुस्त:'} {fmt(stats.staleCount)}
                </span>
              </div>
            </div>

            {/* Circular Gauge Ring */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 self-center sm:self-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-600 dark:text-indigo-400"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42 * stats.weightedRate / 100} ${2 * Math.PI * 42 * (100 - stats.weightedRate) / 100}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-indigo-700 dark:text-indigo-200">
                {fmt(stats.weightedRate)}%
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-extrabold text-slate-600 dark:text-indigo-200/80 pt-1.5 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex flex-col gap-0.5">
              <span>{language === 'en' ? 'Total Indicators:' : 'कुल सूचकहरू:'} <strong className="text-slate-900 dark:text-white">{fmt(stats.total)}</strong></span>
              <span>{language === 'en' ? 'Reporting Offices:' : 'रिपोर्टिङ कार्यालयहरू:'} <strong className="text-slate-900 dark:text-white">{fmt(reportingOffices.length)}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-bold">
              <ChevronDown size={14} className={`transform transition-transform ${showOverallProgress ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card 1: Category Status */}
{!dismissedCards.has('category-status') && (
  <motion.div
    key="category-status"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="category-status" onDismiss={() => handleDismissCard('category-status')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveExpandedModalCardId('category-status');
          toggleCard(setShowCategoryStatus, showCategoryStatus);
        }}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 hover:border-cyan-400/50 dark:hover:border-cyan-500/40 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl shadow-md shadow-cyan-500/30 shrink-0">
            <LayoutGrid size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Category Status' : 'वर्ग स्थिति'}
            </span>
             <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
               {language === 'en' ? '5 Main Sectors' : '५ मुख्य क्षेत्रहरू'}
             </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ChevronDown size={14} className={`transform transition-transform ${showCategoryStatus ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card 2: Status Breakdown */}
{!dismissedCards.has('status-breakdown') && (
  <motion.div
    key="status-breakdown"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="status-breakdown" onDismiss={() => handleDismissCard('status-breakdown')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveExpandedModalCardId('status-breakdown');
          toggleCard(setShowStatusDetails, showStatusDetails);
        }}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 hover:border-amber-400/50 dark:hover:border-amber-500/40 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-md shadow-amber-500/30 shrink-0">
            <BarChart3 size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण'}
            </span>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Performance Categories' : 'कार्यान्वयन स्थिति'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ChevronDown size={14} className={`transform transition-transform ${showStatusDetails ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card 7: Visual Insights */}
{!dismissedCards.has('visual-insights') && (
  <motion.div
    key="visual-insights"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="visual-insights" onDismiss={() => handleDismissCard('visual-insights')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigateToView?.('insights')}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <span className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md shadow-purple-500/30 shrink-0">
            <PieChartIcon size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Visual Insights' : 'दृश्य अन्तर्दृष्टि'}
            </span>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Portfolio Health Chart' : 'पोर्टफोलियो स्वास्थ्य रेखाचित्र'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ExternalLink size={14} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card 5: Budget & Capital Expenditure */}
{!dismissedCards.has('budget-card') && (
  <motion.div
    key="budget-card"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="budget-card" onDismiss={() => handleDismissCard('budget-card')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveExpandedModalCardId('budget-card');
          toggleCard(setShowBudgetCard, showBudgetCard);
        }}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md shadow-blue-500/30 shrink-0">
            <Wallet size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Budget Utilization' : 'बजेट उपयोग'}
            </span>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Capital Expenditure' : 'पूँजीगत खर्च'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ChevronDown size={14} className={`transform transition-transform ${showBudgetCard ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card 6: Employment Creation */}
{!dismissedCards.has('employment-card') && (
  <motion.div
    key="employment-card"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="employment-card" onDismiss={() => handleDismissCard('employment-card')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setActiveExpandedModalCardId('employment-card');
          toggleCard(setShowEmploymentCard, showEmploymentCard);
        }}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="p-2 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-md shadow-teal-500/30 shrink-0">
            <Users size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Employment' : 'रोजगार'}
            </span>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Jobs Created' : 'सिर्जित रोजगारी'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ChevronDown size={14} className={`transform transition-transform ${showEmploymentCard ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}

{/* Card: Detailed Gallery */}
{!dismissedCards.has('detailed-gallery') && (
  <motion.div
    key="detailed-gallery"
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
    transition={{ layout: { type: 'spring', stiffness: 220, damping: 24 } }}
    className="w-full"
  >
    <SwipeableCard cardId="detailed-gallery" onDismiss={() => handleDismissCard('detailed-gallery')}>
      <motion.div
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigateToView?.('detailed-gallery')}
         className="group relative w-full cursor-pointer bg-white dark:bg-slate-800/90 rounded-2xl sm:rounded-[28px] p-2.5 sm:p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-600/90 transition-all duration-300 min-h-[70px] sm:min-h-[80px] flex items-center justify-between hover:-translate-y-1 active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-md shadow-indigo-500/30 shrink-0">
            <ImageIcon size={16} className="text-white" />
          </span>
          <div>
            <span className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Detailed Gallery' : 'विस्तृत ग्यालेरी'}
            </span>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Full Indicators View' : 'पूर्ण सूचक अवलोकन'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600/70">
          <ExternalLink size={14} />
        </div>
      </motion.div>
    </SwipeableCard>
  </motion.div>
)}
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
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowOfficeLogicInfo(false); } }}
                  onClick={() => setShowOfficeLogicInfo(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={18} />
                </div>
              </div>
               <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
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

         {/* Device-Adaptive Modal Overlay for Card Expansion with Reduce Option */}
         <AnimatePresence>
           {activeExpandedModalCardId && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[9990] flex items-start justify-center bg-slate-950/30 md:bg-slate-950/80 backdrop-blur-sm md:backdrop-blur-md p-2 sm:p-3 md:p-6 overflow-y-auto"
               onClick={() => setActiveExpandedModalCardId(null)}
             >
               <motion.div
                 initial={{ scale: 0.93, opacity: 0, y: 15 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.93, opacity: 0, y: 15 }}
                 transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                 onClick={(e) => e.stopPropagation()}
                 className="relative w-full max-w-4xl max-h-[70dvh] sm:max-h-[80dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col mt-4 sm:mt-6 md:mt-8"
               >
                {/* Sticky Header with Title and Prominent REDUCE option */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-2.5 sm:p-3 md:p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    {activeExpandedModalCardId === 'overall-progress' && (
                      <span className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                        <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'category-status' && (
                      <span className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl shadow-md shadow-cyan-500/30 shrink-0">
                        <LayoutGrid size={16} className="text-white" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'status-breakdown' && (
                      <span className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-md shadow-amber-500/30 shrink-0">
                        <BarChart3 size={16} className="text-white" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'reporting-offices' && (
                      <span className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                        <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'budget-card' && (
                      <span className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md shadow-blue-500/30 shrink-0">
                        <Wallet size={16} className="text-white" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'employment-card' && (
                      <span className="p-2 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-md shadow-teal-500/30 shrink-0">
                        <Users size={16} className="text-white" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'visual-insights-gallery' && (
                      <span className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md shadow-purple-500/30 shrink-0">
                        <PieChartIcon size={16} className="text-white" />
                      </span>
                    )}
                    {activeExpandedModalCardId === 'detailed-gallery' && (
                      <span className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-md shadow-indigo-500/30 shrink-0">
                        <ImageIcon size={16} className="text-white" />
                      </span>
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {activeExpandedModalCardId === 'overall-progress' && (language === 'en' ? 'DOR OVERALL PERFORMANCE' : 'डी.ओ.आर. समग्र कार्यसम्पादन')}
                        {activeExpandedModalCardId === 'category-status' && (language === 'en' ? 'Category Status' : 'वर्ग स्थिति')}
                        {activeExpandedModalCardId === 'status-breakdown' && (language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण')}
                        {activeExpandedModalCardId === 'reporting-offices' && (language === 'en' ? 'Reporting Field Offices' : 'रिपोर्टिङ क्षेत्र कार्यालयहरू')}
                        {activeExpandedModalCardId === 'budget-card' && (language === 'en' ? 'Budget Utilization' : 'बजेट उपयोग')}
                        {activeExpandedModalCardId === 'employment-card' && (language === 'en' ? 'Employment' : 'रोजगार')}
                        {activeExpandedModalCardId === 'visual-insights-gallery' && (language === 'en' ? 'Visual Insights' : 'दृश्य अन्तर्दृष्टि')}
                        {activeExpandedModalCardId === 'detailed-gallery' && (language === 'en' ? 'Detailed Gallery' : 'विस्तृत ग्यालेरी')}
                      </h2>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {activeExpandedModalCardId === 'overall-progress' && (language === 'en' ? 'FY: 2082/83' : 'आर्थिक वर्ष: २०८२/८३')}
                        {activeExpandedModalCardId === 'category-status' && (language === 'en' ? '5 Main Sectors' : '५ मुख्य क्षेत्रहरू')}
                        {activeExpandedModalCardId === 'status-breakdown' && (language === 'en' ? 'Performance Categories' : 'कार्यान्वयन स्थिति')}
                        {activeExpandedModalCardId === 'reporting-offices' && (language === 'en' ? `${reportingOffices.length} offices` : `${reportingOffices.length} कार्यालयहरू`)}
                        {activeExpandedModalCardId === 'budget-card' && (language === 'en' ? 'Capital Expenditure' : 'पूँजीगत खर्च')}
                        {activeExpandedModalCardId === 'employment-card' && (language === 'en' ? 'Jobs Created' : 'सिर्जित रोजगारी')}
                        {activeExpandedModalCardId === 'visual-insights-gallery' && (language === 'en' ? 'Portfolio Health Chart' : 'पोर्टफोलियो स्वास्थ्य रेखाचित्र')}
                        {activeExpandedModalCardId === 'detailed-gallery' && (language === 'en' ? 'Full Indicators View' : 'पूर्ण सूचक अवलोकन')}
                      </p>
                    </div>
                  </div>

                  {/* Prominent Reduce Button */}
                  <button
                    onClick={() => {
                      setActiveExpandedModalCardId(null);
                      if (activeExpandedModalCardId) {
                        const cardId = activeExpandedModalCardId === 'visual-insights-gallery'
                          ? 'visual-insights'
                          : activeExpandedModalCardId === 'detailed-gallery'
                            ? 'detailed-gallery'
                            : activeExpandedModalCardId;
                        handleDismissCard(cardId);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95"
                     aria-label={language === 'en' ? 'Reduce / Collapse Card' : 'कार्ड घटाउनुहोस् / सानो बनाउनुहोस्'}
                     title={language === 'en' ? 'Reduce / Collapse Card' : 'कार्ड घटाउनुहोस् / सानो बनाउनुहोस्'}
                  >
                    <Minimize2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="uppercase tracking-wider">{language === 'en' ? 'Reduce' : 'घटाउनुहोस्'}</span>
                  </button>
                </div>

                 {/* Scrollable Expanded View Content */}
                   <div className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 overflow-y-auto space-y-2 sm:space-y-3 custom-scrollbar">
                  {/* Card 0: Overall Progress Performance Expanded Modal */}
                  {activeExpandedModalCardId === 'overall-progress' && (
                    <div className="space-y-3">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between items-center text-center">
                         <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                           {language === 'en' ? 'Weighted Achievement' : 'भारित उपलब्धि'}
                         </span>
                         <div className="my-3">
                           <span className="text-5xl font-black">{fmt(stats.weightedRate)}%</span>
                         </div>
                         <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                           <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${stats.weightedRate}%` }} />
                         </div>
                       </div>

                       <div className="md:col-span-2 grid grid-cols-2 gap-3">
                         <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                           <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                             {language === 'en' ? 'On Track (≥80%)' : 'सफल (≥८०%)'}
                           </span>
                           <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">{fmt(stats.onTrack)}</span>
                         </div>
                         <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                           <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-1">
                             {language === 'en' ? 'Needs Attention (40-79%)' : 'ध्यान आवश्यक (४०-७९%)'}
                           </span>
                           <span className="text-2xl font-black text-amber-800 dark:text-amber-200">{fmt(stats.needsAttention)}</span>
                         </div>
                         <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200/50 dark:border-rose-800/50">
                           <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block mb-1">
                             {language === 'en' ? 'Delayed (<40%)' : 'सुस्त (<४०%)'}
                           </span>
                           <span className="text-2xl font-black text-rose-800 dark:text-rose-200">{fmt(stats.staleCount)}</span>
                         </div>
                         <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50">
                           <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
                             {language === 'en' ? 'Total Indicators' : 'कुल सूचकहरू'}
                           </span>
                           <span className="text-2xl font-black text-indigo-800 dark:text-indigo-200">{fmt(stats.total)}</span>
                         </div>
                       </div>
                     </div>

                     {/* Formula Callout */}
                     <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                       <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                         {language === 'en' ? 'Calculation Methodology' : 'गणना विधि तथा सूत्र'}
                       </h4>
                       <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                         {language === 'en'
                           ? 'Weighted Progress Rate = Σ [ (Indicator Progress ÷ Target) × Weight ] ÷ Σ (Total Weights). All values are synchronized in real-time from official Google Sheets.'
                           : 'भारित प्रगति दर = Σ [ (सूचक प्रगति ÷ लक्ष्य) × भार ] ÷ Σ (कुल भार)। सबै मानहरू आधिकारिक गुगल शीटबाट प्रत्यक्ष अद्यावधिक हुन्छन्।'}
                       </p>
                     </div>

                     {/* Indicator list inside expanded modal */}
                     <div className="space-y-3">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                         <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                           {language === 'en' ? 'Complete System Indicators' : 'सबै सूचकहरूको पूर्ण विवरण'} ({indicators.length})
                         </h4>
                         <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                           <Search size={14} className="text-slate-400" />
                           <input
                             type="text"
                             value={modalSearchQuery}
                             onChange={(e) => setModalSearchQuery(e.target.value)}
                             placeholder={language === 'en' ? 'Search indicators...' : 'सूचकहरू खोज्नुहोस्...'}
                             className="w-full sm:w-48 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                           />
                         </div>
                       </div>

                       <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[450px] overflow-y-auto">
                         {indicators
                           .filter((ind) => {
                             if (!ind) return false;
                             if (!modalSearchQuery) return true;
                             const q = modalSearchQuery.toLowerCase();
                             return (
                               (ind.name || '').toLowerCase().includes(q) ||
                               (ind.nameEn || '').toLowerCase().includes(q) ||
                               (ind.category || '').toLowerCase().includes(q)
                             );
                           })
                           .map((ind) => {
                             if (!ind) return null;
                             const pct = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
                             return (
                               <div
                                 key={ind.id}
                                 onClick={() => handleIndicatorAction(ind, 'click')}
                                 className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                               >
                                 <div className="min-w-0 flex-1">
                                   <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                     {language === 'en' ? ind.nameEn || ind.name : ind.name}
                                   </p>
                                   <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                     <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                                       {translateCategory(ind.category)}
                                     </span>
                                     <span>
                                       {translateUnit(ind.unit)} • {language === 'en' ? 'Target:' : 'लक्ष्य:'} {fmt(ind.annualTarget)} | {language === 'en' ? 'Progress:' : 'प्रगति:'} {fmt(ind.annualProgress)}
                                     </span>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0 text-right">
                                   <div>
                                     <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">{pct}%</span>
                                     <span className="text-[10px] font-bold text-slate-400">{ind.weight || 0}% {language === 'en' ? 'Weight' : 'भार'}</span>
                                   </div>
                                   <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                                     <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                       </div>
                     </div>

                     {/* Reporting Field Offices Section in Card 0 Modal */}
                     <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                       <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                           <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                           {language === 'en' ? 'Reporting Field Offices Breakdown' : 'रिपोर्टिङ क्षेत्र कार्यालयहरूको पूर्ण विवरण'} ({reportingOffices.length})
                         </h4>
                       </div>

                       {/* Explanation Info Banner */}
                       <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
                         <Info size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                         <p className="text-[11px] leading-relaxed">
                           {language === 'en'
                             ? 'Each card shows the office ID, assigned superadmin email, and the percentage score representing the overall combined progress across all indicators of that office.'
                             : 'प्रत्येक कार्डमा कार्यालय कोड, तोकिएको प्रशासक इमेल, र अन्तिम पंक्तिमा सो कार्यालयका सम्पूर्ण सूचकहरूको संयुक्त समग्र उपलब्धि दर देखाइएको छ।'}
                         </p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                         {reportingOffices.map((off) => {
                           const rawName = translateOffice(off.office);
                           const cleanName = rawName.replace(/^[\d.]+\s*[-–—]?\s*/, '').trim();

                           return (
                             <div
                               key={off.office}
                               className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between gap-3"
                             >
                               <div className="space-y-1.5 min-w-0">
                                 {/* Line 1: Prefix numeric (office ID) */}
                                 <div className="flex items-center justify-between gap-1.5">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                     <Building2 size={10} className="shrink-0" />
                                     {language === "en"
                                       ? `ID: ${off.officeId || "—"}`
                                       : `कार्यालय कोड: ${toNepaliNumerals(off.officeId || "—")}`}
                                   </span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                     {language === 'en' ? 'Active Unit' : 'सक्रिय एकाइ'}
                                   </span>
                                 </div>

                                 {/* Line 2: Clean Name without duplicate ID prefix */}
                                 <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-snug pt-0.5">
                                   {cleanName}
                                 </h4>

                                 {/* Line 3: Admin email */}
                                 <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate pt-0.5">
                                   <Mail size={12} className="shrink-0 text-indigo-500" />
                                   <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                                     {language === 'en' ? 'Admin:' : 'प्रशासक:'}
                                   </span>
                                   <span className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                                     {off.adminEmail || (language === 'en' ? 'Unassigned' : 'अपरिभाषित')}
                                   </span>
                                 </div>
                               </div>

                               {/* Last Line: Percentage score & description */}
                               <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 min-w-0 truncate" title={language === 'en' ? 'Combined completion rate across all indicators for this office' : 'यस कार्यालयका संयुक्त सूचकहरूको समग्र उपलब्धि दर'}>
                                   <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                   <span className="truncate">
                                     {language === 'en' ? 'Overall Progress:' : 'समग्र उपलब्धि दर:'}
                                   </span>
                                 </span>
                                 <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                                   {off.score > 0 ? (language === 'en' ? `${off.score}%` : `${toNepaliNumerals(off.score)}%`) : "—"}
                                 </span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   </div>
                 )}

                   {/* Card 1: Category Status Modal */}
                   {activeExpandedModalCardId === 'category-status' && (
                     <div className="space-y-3">
                       <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                         {STANDARD_CATEGORIES.map((cat) => {
                           const catIndicators = indicators.filter(i => i && normalizeCategory(i.category) === cat);
                           if (catIndicators.length === 0) return null;
                           
                           return (
                             <div key={cat} className="space-y-1.5">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                   <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                     {translateCategory(cat)}
                                   </span>
                                 </div>
                                 <span className="text-xs font-black text-slate-900 dark:text-white">
                                   {(() => {
                                     const totalT = catIndicators.reduce((a, b) => a + (b.annualTarget || 0), 0);
                                     const totalP = catIndicators.reduce((a, b) => a + (b.annualProgress || 0), 0);
                                     const avgPct = totalT > 0 ? Math.min(100, Math.round((totalP / totalT) * 100)) : 0;
                                     return `${avgPct}%`;
                                   })()}
                                 </span>
                               </div>
                               <div className="space-y-1 pl-4">
                                 {catIndicators.map((ind) => (
                                   <div key={ind.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                     {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                  {/* Card 2: Performance Status Breakdown Modal */}
                  {activeExpandedModalCardId === 'status-breakdown' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/50">
                          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 block">{language === 'en' ? 'On Track (≥80%)' : 'लक्ष्य अनुरूप (≥८०%)'}</span>
                          <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">{fmt(stats.onTrack)}</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/50">
                          <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 block">{language === 'en' ? 'Below Target (40-79%)' : 'लक्ष्य भन्दा कम (४०-७९%)'}</span>
                          <span className="text-xl font-black text-amber-800 dark:text-amber-200">{fmt(stats.needsAttention)}</span>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200/50">
                          <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 block">{language === 'en' ? 'Needs Attention (<40%)' : 'ध्यान आवश्यक (<४०%)'}</span>
                          <span className="text-xl font-black text-rose-800 dark:text-rose-200">{fmt(stats.staleCount)}</span>
                        </div>
                      </div>

                       <div className="space-y-2 pt-2">
                         <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                           {language === 'en' ? 'Indicator Status Details' : 'सूचकहरूको कार्यसम्पादन स्थिति विवरण'}
                         </h4>
                         <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                           {/* On Track */}
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                               <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                 {language === 'en' ? `On Track (≥80%) — ${stats.onTrack}` : `सफल (≥८०%) — ${stats.onTrack}`}
                               </span>
                             </div>
                             <div className="space-y-1 pl-4">
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) >= 80).map((ind) => (
                                 <div key={ind.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                   {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                                 </div>
                               ))}
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) >= 80).length === 0 && (
                                 <div className="text-[10px] font-semibold text-slate-400 italic">{language === 'en' ? 'None' : 'कुनै छैन'}</div>
                               )}
                             </div>
                           </div>

                           {/* Below Target */}
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                               <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                 {language === 'en' ? `Below Target (40-79%) — ${stats.needsAttention}` : `मध्यम (४०-७९%) — ${stats.needsAttention}`}
                               </span>
                             </div>
                             <div className="space-y-1 pl-4">
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) >= 40 && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) < 80).map((ind) => (
                                 <div key={ind.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                   {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                                 </div>
                               ))}
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) >= 40 && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) < 80).length === 0 && (
                                 <div className="text-[10px] font-semibold text-slate-400 italic">{language === 'en' ? 'None' : 'कुनै छैन'}</div>
                               )}
                             </div>
                           </div>

                           {/* Needs Attention */}
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                               <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                 {language === 'en' ? `Needs Attention (<40%) — ${stats.staleCount}` : `गम्भीर (<४०%) — ${stats.staleCount}`}
                               </span>
                             </div>
                             <div className="space-y-1 pl-4">
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) < 40).map((ind) => (
                                 <div key={ind.id} className="text-xs font-bold text-slate-800 dark:text-slate-200 py-0.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                   {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                                 </div>
                               ))}
                               {indicators.filter(i => i && (i.annualTarget > 0 ? Math.min(100, Math.round((i.annualProgress / i.annualTarget) * 100)) : 0) < 40).length === 0 && (
                                 <div className="text-[10px] font-semibold text-slate-400 italic">{language === 'en' ? 'None' : 'कुनै छैन'}</div>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* Card 4: Reporting Offices Modal */}
                  {activeExpandedModalCardId === 'reporting-offices' && (
                    <div className="space-y-3">
                      {/* Explanation Info Banner */}
                      <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
                        <Info size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          {language === 'en'
                            ? 'The percentage value shown at the bottom of each office card represents the overall combined progress across all indicators of that office.'
                            : 'प्रत्येक कार्डको अन्तिम पंक्तिमा देखाइएको प्रतिशतले सो क्षेत्र कार्यालयको सम्पूर्ण सूचकहरूको संयुक्त समग्र उपलब्धि दरलाई जनाउँछ।'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reportingOffices.map((off) => {
                          const rawName = translateOffice(off.office);
                          const cleanName = rawName.replace(/^[\d.]+\s*[-–—]?\s*/, '').trim();

                          return (
                            <div
                              key={off.office}
                              className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between gap-3"
                            >
                              <div className="space-y-1.5 min-w-0">
                                {/* Line 1: Prefix numeric (office ID) */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <Building2 size={10} className="shrink-0" />
                                    {language === "en"
                                      ? `ID: ${off.officeId || "—"}`
                                      : `कार्यालय कोड: ${toNepaliNumerals(off.officeId || "—")}`}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    {language === 'en' ? 'Active Unit' : 'सक्रिय एकाइ'}
                                  </span>
                                </div>

                                {/* Line 2: Clean Name without duplicate ID prefix */}
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-snug pt-0.5">
                                  {cleanName}
                                </h4>

                                {/* Line 3: Admin email */}
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate pt-0.5">
                                  <Mail size={12} className="shrink-0 text-indigo-500" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                                    {language === 'en' ? 'Admin:' : 'प्रशासक:'}
                                  </span>
                                  <span className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                                    {off.adminEmail || (language === 'en' ? 'Unassigned' : 'अपरिभाषित')}
                                  </span>
                                </div>
                              </div>

                              {/* Last Line: Percentage score & description */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 min-w-0 truncate" title={language === 'en' ? 'Combined completion rate across all indicators for this office' : 'यस कार्यालयका संयुक्त सूचकहरूको समग्र उपलब्धि दर'}>
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  <span className="truncate">
                                    {language === 'en' ? 'Overall Progress:' : 'समग्र उपलब्धि दर:'}
                                  </span>
                                </span>
                                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                                  {off.score > 0 ? (language === 'en' ? `${off.score}%` : `${toNepaliNumerals(off.score)}%`) : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Card 5: Budget Utilization Modal */}
                  {activeExpandedModalCardId === 'budget-card' && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center">
                       <div>
                         <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block">{language === 'en' ? 'Live Sheet Budget Progress' : 'प्रत्यक्ष बजेट प्रगति'}</span>
                         <span className="text-3xl font-black mt-1 block">{fmt(budgetMetrics.totalProgress)} {budgetMetrics.unit}</span>
                         <span className="text-xs text-blue-100 font-bold mt-1 block">{language === 'en' ? 'Target:' : 'लक्ष्य:'} {fmt(budgetMetrics.totalTarget)} {budgetMetrics.unit}</span>
                       </div>
                       <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-md text-center">
                         <span className="text-2xl font-black">{budgetMetrics.percentage}%</span>
                         <span className="text-[10px] font-bold text-blue-100 block uppercase">{language === 'en' ? 'Spent' : 'खर्च'}</span>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">{language === 'en' ? 'Financial Indicators' : 'वित्तीय सूचकहरू'}</h4>
                       <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                         {budgetMetrics.indicators.map((ind) => (
                           <div key={ind.id} className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'en' ? ind.nameEn || ind.name : ind.name}</span>
                             <span className="text-xs font-black text-blue-600 dark:text-blue-400">{fmt(ind.annualProgress)} / {fmt(ind.annualTarget)} {translateUnit(ind.unit)}</span>
                           </div>
                         ))}
                         {budgetMetrics.indicators.length === 0 && (
                           <p className="p-4 text-center text-xs text-slate-500">{language === 'en' ? 'No specific budget indicators found in current sheet view.' : 'हालको शीटमा कुनै विशिष्ट बजेट सूचकहरू फेला परेनन्।'}</p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}

                  {/* Card 6: Employment Creation Modal */}
                  {activeExpandedModalCardId === 'employment-card' && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center">
                       <div>
                         <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">{language === 'en' ? 'Jobs / Person Days Created' : 'सिर्जित रोजगारी / व्यक्ति दिन'}</span>
                         <span className="text-3xl font-black mt-1 block">{fmt(employmentMetrics.totalProgress)}</span>
                         <span className="text-xs text-teal-100 font-bold mt-1 block">{language === 'en' ? 'Target:' : 'लक्ष्य:'} {fmt(employmentMetrics.totalTarget || employmentMetrics.totalProgress)}</span>
                       </div>
                       <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-md text-center">
                         <span className="text-2xl font-black">{employmentMetrics.percentage}%</span>
                         <span className="text-[10px] font-bold text-teal-100 block uppercase">{language === 'en' ? 'Achieved' : 'हासिल'}</span>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">{language === 'en' ? 'Employment Indicators' : 'रोजगार सूचकहरू'}</h4>
                       <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                         {employmentMetrics.indicators.map((ind) => (
                           <div key={ind.id} className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'en' ? ind.nameEn || ind.name : ind.name}</span>
                             <span className="text-xs font-black text-teal-600 dark:text-teal-400">{fmt(ind.annualProgress)} / {fmt(ind.annualTarget)} {translateUnit(ind.unit)}</span>
                           </div>
                         ))}
                         {employmentMetrics.indicators.length === 0 && (
                           <p className="p-4 text-center text-xs text-slate-500">{language === 'en' ? 'Employment metrics derived from live department data.' : 'विभागीय डाटाबाट प्राप्त रोजगारी तथ्याङ्क।'}</p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}

                  {/* Card 7: Visual Insights Gallery Modal */}
                  {activeExpandedModalCardId === 'visual-insights-gallery' && (
                    <div className="space-y-3">
                     <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                       {language === 'en' ? 'Comprehensive visual gallery and analytics dashboard view.' : 'विस्तृत दृश्य ग्यालेरी र विश्लेषण ड्यासबोर्ड।'}
                     </p>
                     <button
                       onClick={() => {
                         setActiveExpandedModalCardId(null);
                         onNavigateToView?.('detailed-gallery');
                       }}
                       className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-lg hover:bg-indigo-500 transition-all cursor-pointer flex items-center justify-center gap-2"
                     >
                       <span>{language === 'en' ? 'Open Full Gallery Page' : 'पूर्ण ग्यालेरी पृष्ठ खोल्नुहोस्'}</span>
                       <ArrowUpRight size={16} />
                     </button>
                   </div>
                 )}
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
  );
};

