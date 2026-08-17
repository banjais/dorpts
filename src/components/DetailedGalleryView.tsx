import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp,
  TrendingDown,
  Calendar,
  LayoutGrid,
  X,
  MoreHorizontal,
  Edit3,
  MessageSquare,
  Clock,
  Building2,
  Calculator,
  Database,
  Minimize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { StatusBreakdownModal } from './StatusBreakdownModal';
import { IndicatorsBreakdownModal } from './IndicatorsBreakdownModal';
import { ProgressLogicModal } from './ProgressLogicModal';
import { SystemHelpModal } from './SystemHelpModal';

interface DetailedGalleryViewProps {
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  offices?: {
    name: string;
    officeId: string;
    shortName: string;
    updated: string;
    avgCompletion?: number;
    total?: number;
    onTrack?: number;
    attention?: number;
    stale?: number;
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
        className={`relative w-full rounded-[24px] border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
          isExpanded
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl'
        } border-r-2`}
        style={{ borderRightColor: catColor.hex }}
      >
        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700" />

        <div className="p-3 sm:p-4 text-left">
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

          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mb-2">
            {language === 'en' ? indicator.nameEn : indicator.name}
          </h4>

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

export const DetailedGalleryView: React.FC<DetailedGalleryViewProps> = ({
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
  const { language, t, translateUnit, translateOffice } = useLanguage();
  const { isAdmin } = useAuth();
  const isNepali = language === 'ne';
  const fmt = (val: number | string): string => {
    if (isNepali) return toNepaliNumerals(val);
    return String(val);
  };

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortType, setSortType] = useState<'default' | 'low' | 'high' | 'weight' | 'status'>('default');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(false);
  const [showIndicatorsBreakdown, setShowIndicatorsBreakdown] = useState(false);
  const [showProgressLogic, setShowProgressLogic] = useState(false);
  const [showOfficeLogicInfo, setShowOfficeLogicInfo] = useState(false);
  const [showSystemHelpModal, setShowSystemHelpModal] = useState(false);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());
  const [showOverallProgress, setShowOverallProgress] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [showTotalIndicators, setShowTotalIndicators] = useState(false);
  const [showReportingOffices, setShowReportingOffices] = useState(false);
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [showCategoryStatus, setShowCategoryStatus] = useState(false);
  const [showBudgetCard, setShowBudgetCard] = useState(false);
  const [showEmploymentCard, setShowEmploymentCard] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showOverallLogicInline, setShowOverallLogicInline] = useState(false);
  const [showStatusLogicInline, setShowStatusLogicInline] = useState(false);
  const [showCategoryLogicInline, setShowCategoryLogicInline] = useState(false);
  const [insightTab, setInsightTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>('health');
  const [portfolioMode, setPortfolioMode] = useState<'bar' | 'pie'>('bar');
  const [categoryMode, setCategoryMode] = useState<'bar' | 'pie'>('bar');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const allIndicatorsRef = useRef<HTMLDivElement>(null);
  const lastCardRef = useRef<HTMLDivElement>(null);
  const [cardsReachedHeader, setCardsReachedHeader] = useState(false);
  const [cardsHidden, setCardsHidden] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setIsSpeaking(window.speechSynthesis.speaking);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const closeAllCards = useCallback(() => {
    setShowOverallProgress(false);
    setShowStatusDetails(false);
    setShowTotalIndicators(false);
    setShowReportingOffices(false);
    setShowAllIndicators(false);
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

  const handleDismissCard = useCallback((cardId: string) => {
    setDismissedCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
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
      // scroll to insights card if it exists
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightedCard]);

  const weightedAchievementRate = useMemo(() => {
    const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0);
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
      .map((office) => {
        const avgCompletion = office.avgCompletion ?? 0;
        return {
          office: office.name,
          officeId: office.officeId,
          shortName: office.shortName,
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
    if (highlightedCard === 'insights') {
      setInsightTab('health');
    }
  }, [highlightedCard]);

  return (
    <div className="relative min-h-screen space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <style>{`
        @media (max-width: 768px) {
          .dashboard-cards-grid {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding-bottom: 6rem;
            margin-left: -1rem;
            margin-right: -1rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .dashboard-cards-grid > * {
            width: 100%;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 2px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.15) transparent;
        }
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

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-500 text-white rounded-xl">
            <LayoutGrid size={18} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Detailed Gallery' : 'विस्तृत ग्यालरी'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? `${stats.total} indicators tracked` : `${stats.total} सूचकहरू ट्र्याक गरिएको`}
            </p>
          </div>
        </div>
        {onNavigateToView && (
          <button
            onClick={() => {
              onNavigateToView('dashboard');
              window.dispatchEvent(new CustomEvent('dismiss-card', { detail: { cardId: 'detailed-gallery' } }));
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            title={language === 'en' ? 'Reduce / Collapse Card' : 'कार्ड घटाउनुहोस् / सानो बनाउनुहोस्'}
          >
            <Minimize2 size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="uppercase tracking-wider">{language === 'en' ? 'Reduce' : 'घटाउनुहोस्'}</span>
          </button>
        )}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Total' : 'कुल'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {fmt(stats.total)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'On Track' : 'सम्पादनमा'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {fmt(stats.onTrack)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Offices' : 'कार्यालय'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {fmt(reportingOffices.length)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Weighted Rate' : 'भारित दर'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {fmt(stats.weightedRate)}%
          </div>
        </div>
      </div>

       {/* Filters */}
       <div className="bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 backdrop-blur-sm">
         <div className="flex flex-col sm:flex-row gap-3">
           <div className="flex-1">
             <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
               {language === 'en' ? 'Category' : 'वर्ग'}
             </span>
             <select
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
               className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 cursor-pointer transition-all"
             >
               <option value="All">{language === 'en' ? 'All Categories' : 'सबै वर्गहरू'}</option>
               {STANDARD_CATEGORIES.map((cat) => (
                 <option key={cat} value={cat}>{language === 'en' ? cat.split(' ')[0] : cat.split(' ')[0]}</option>
               ))}
             </select>
           </div>
           <div className="flex-1">
             <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
               {language === 'en' ? 'Sort By' : 'क्रमबद्ध गर्नुहोस्'}
             </span>
             <select
               value={sortType}
               onChange={(e) => setSortType(e.target.value as any)}
               className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 cursor-pointer transition-all"
             >
               <option value="default">{language === 'en' ? 'Default' : 'पूर्वावस्थानुसार'}</option>
               <option value="low">{language === 'en' ? 'Low to High' : 'कमदेखि बढी'}</option>
               <option value="high">{language === 'en' ? 'High to Low' : 'बढीदेखि कम'}</option>
               <option value="weight">{language === 'en' ? 'By Weight' : 'भार अनुसार'}</option>
               <option value="status">{language === 'en' ? 'By Status' : 'स्थिति अनुसार'}</option>
             </select>
           </div>
         </div>
       </div>

      {/* Indicator Grid */}
      {!expandedId && filteredIndicators.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 inline-block rounded-full mb-3">
            <Filter className="text-slate-400" size={24} />
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-bold text-sm">
            {language === 'en' ? 'No indicators found' : 'कुनै सूचकहरू फेला परेनन्'}
          </h3>
          <p className="text-[0.6875rem] text-slate-400 dark:text-slate-500 mt-1">
            {language === 'en' ? 'Try adjusting your category filter' : 'वर्ग फिल्टर परिवर्तन गर्नुहोस्'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-3">
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

      {/* Full-screen expanded card modal - hides all other cards */}
      <AnimatePresence>
        {expandedId && (() => {
          const expandedIndicator = indicators.find(ind => ind.id === expandedId);
          if (!expandedIndicator) return null;
          const pct = expandedIndicator.annualTarget > 0 ? Math.min(100, Math.round((expandedIndicator.annualProgress / expandedIndicator.annualTarget) * 100)) : 0;
          const status = getStatusBadge(pct, t);
          const sparkline = getSparklineData(expandedIndicator.id, expandedIndicator.annualProgress, expandedIndicator.annualTarget, metadata?.lastUpdateDate);
          const catColor = getCategoryColor(expandedIndicator.category);
          const weight = expandedIndicator.weight || 0;
          const trendDirection = sparkline.length >= 2 ? sparkline[sparkline.length - 1].value - sparkline[0].value : 0;
          const isTrendUp = trendDirection > 0;
          const isTrendDown = trendDirection < 0;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-y-auto"
              onClick={() => setExpandedId(null)}
            >
              <div className="sticky top-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                    <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {language === 'en' ? expandedIndicator.nameEn : expandedIndicator.name}
                    </h2>
                    <span className="text-[10px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                      {normalizeCategory(expandedIndicator.category).split(' ')[0]}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 max-w-4xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white leading-none">
                      {language === 'ne' ? toNepaliNumerals(pct.toString()) : pct}%
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Weight' : 'भार'}: {language === 'ne' ? toNepaliNumerals(weight.toString()) : weight}%
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {fmt(expandedIndicator.annualProgress?.toLocaleString() ?? 0)} / {fmt(expandedIndicator.annualTarget?.toLocaleString() ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTrendUp && <TrendingUp size={20} className="text-emerald-500" />}
                    {isTrendDown && <TrendingDown size={20} className="text-rose-500" />}
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="h-[200px] sm:h-[250px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkline} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id={`grad-expanded-${expandedIndicator.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={catColor.hex} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={catColor.hex} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <RechartsTooltip content={<CustomSparklineTooltip language={language} />} />
                      <Area type="monotone" dataKey="value" stroke={catColor.hex} strokeWidth={2} fill={`url(#grad-expanded-${expandedIndicator.id})`} dot={{ r: 4, fill: catColor.hex, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {language === 'en' ? 'Target vs Progress' : 'लक्ष्य र प्रगति'}
                    </span>
                    <span className={`text-sm font-black ${pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {fmt(pct)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: catColor.hex }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      {language === 'en' ? 'Target' : 'लक्ष्य'}: {fmt(expandedIndicator.annualTarget?.toLocaleString() ?? 0)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      {language === 'en' ? 'Progress' : 'प्रगति'}: {fmt(expandedIndicator.annualProgress?.toLocaleString() ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {onViewHistory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(expandedIndicator);
                        triggerHaptic('light');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-xs font-bold"
                    >
                      <Clock size={14} />
                      {language === 'en' ? 'History' : 'इतिहास'}
                    </button>
                  )}
                  {onOpenComments && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComments(expandedIndicator);
                        triggerHaptic('light');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-xs font-bold"
                    >
                      <MessageSquare size={14} />
                      {language === 'en' ? 'Comments' : 'टिप्पणीहरू'}
                    </button>
                  )}
                  {isAdmin && onIndicatorClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIndicatorClick(expandedIndicator);
                        triggerHaptic('light');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-xs font-bold"
                    >
                      <Edit3 size={14} />
                      {language === 'en' ? 'Edit' : 'सम्पादन'}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  <Calendar size={12} />
                  <span>
                    {expandedIndicator.updatedAt
                      ? formatNepaliDate(expandedIndicator.updatedAt, language === 'ne' ? 'np' : 'en')
                      : '—'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Modals */}
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
                        ? 'Each office\'s score is calculated from the Offices sheet. For every numeric indicator column, the system computes: (office value ÷ total value) × 100. The office % shown is the average of these column-wise completion percentages.'
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
                        ? 'The Total row from the Offices sheet is used as the baseline. If an office has no indicator data yet, it is shown as "—" instead of 0%.'
                        : 'कार्यालय शीटको कुल पङ्क्तिलाई आधाररेखा रूपमा प्रयोग गरिन्छ। यदि कार्यालयलाई अझै सूचक तथ्याङ्क छैन भने ०% को सट्टा "—" देखाइन्छ।'}
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