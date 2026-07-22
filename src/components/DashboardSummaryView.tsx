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
  Filter, ChevronDown, ChevronRight, Target, MessageSquare, History, Edit3,
  TrendingUp, TrendingDown, Calendar, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, AreaChart as AreaChartIcon, Info, MoreHorizontal,
  LayoutGrid, Activity, Wallet, PiggyBank, Building2, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Clock, X, Calculator, Database, Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, AreaChart, Area, CartesianGrid,
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

const getSparklineData = (indicatorId: string, currentProgress: number, currentTarget: number, currentDate?: string): { date: string; value: number }[] => {
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
        <div className="font-extrabold text-indigo-400">{language === 'en' ? 'Progress' : 'प्रगति'}: {data.value}%</div>
        <div className="text-slate-300 font-semibold mt-0.5">{language === 'en' ? 'Date' : 'मिति'}: {data.date}</div>
      </div>
    );
  }
  return null;
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
          <span className={`text-xs font-black ${pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{fmt(pct)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: catColor.hex }}
            initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
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
          <button onClick={(e) => { e.stopPropagation(); onViewHistory(indicator); triggerHaptic('light'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold">
            <MoreHorizontal size={10} />{language === 'en' ? 'More' : 'थप'}
          </button>
        )}
        {onOpenComments && (
          <button onClick={(e) => { e.stopPropagation(); onOpenComments(indicator); triggerHaptic('light'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-[10px] font-bold">
            <MessageSquare size={10} />{language === 'en' ? 'Comments' : 'टिप्पणी'}
          </button>
        )}
        {isAdmin && onClick && (
          <button onClick={(e) => { e.stopPropagation(); onClick(); triggerHaptic('light'); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-[10px] font-bold">
            <Edit3 size={10} />{language === 'en' ? 'Edit' : 'सम्पादन'}
          </button>
        )}
      </div>
    </div>
  );
};

const getCardGradient = (status: { status: string }, categoryColor: { hex: string }) => {
  if (status.status === 'onTrack' || status.status === 'excellent') return 'from-emerald-500/90 via-teal-500 to-cyan-500';
  if (status.status === 'delayed' || status.status === 'atRisk') return 'from-rose-500/90 via-orange-500 to-amber-500';
  if (status.status === 'progressing') return 'from-amber-500/90 via-orange-400 to-rose-400';
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
  const trendDirection = sparklineData.length >= 2 ? sparklineData[sparklineData.length - 1].value - sparklineData[0].value : 0;
  const isTrendUp = trendDirection > 0;
  const isTrendDown = trendDirection < 0;
  const fmt = (val: number | string): string => {
    if (language === 'ne') return toNepaliNumerals(val);
    return String(val);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03 }} className="relative">
      <motion.button whileTap={{ scale: 0.97 }} onClick={onToggle}
        className={`relative w-full rounded-[24px] border overflow-hidden transition-all duration-300 ${
          isExpanded ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl'}`}>
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
        <div className="p-3 sm:p-4 text-left">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: catColor.hex }} />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
                {normalizeCategory(indicator.category).split(' ')[0]}
              </span>
              {isTrendUp && <TrendingUp size={12} className="text-emerald-500 shrink-0" />}
              {isTrendDown && <TrendingDown size={12} className="text-rose-500 shrink-0" />}
              {!isTrendUp && !isTrendDown && sparklineData.length >= 2 && (
                <span className="text-[10px] font-black text-slate-400 shrink-0">—</span>
              )}
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mb-2">
            {language === 'en' ? indicator.nameEn : indicator.name}
          </h4>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none">{nepaliPercent}%</div>
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
      </motion.button>
    </motion.div>
  );
};

export const DashboardSummaryView: React.FC<DashboardSummaryViewProps> = ({
  indicators, metadata, offices, updatesHistory = [], onOpenAbout, onOpenDataHealth,
  onIndicatorClick, onOpenComments, onViewHistory, onSelectIndicatorFromBreakdown,
  addToast, highlightedCard, isFooterExpanded, isAtBottom: _isAtBottomProp,
  onCardsReachedHeader, onCardsHidden,
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
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [showCategoryStatus, setShowCategoryStatus] = useState(false);
  const allIndicatorsRef = useRef<HTMLDivElement>(null);

  const closeAllCards = useCallback(() => {
    setShowOverallProgress(false); setShowStatusDetails(false); setShowTotalIndicators(false);
    setShowReportingOffices(false); setShowAllIndicators(false); setShowCategoryStatus(false);
    setShowBudgetCard(false); setShowEmploymentCard(false); setShowInsights(false);
    setShowStatusBreakdown(false); setShowIndicatorsBreakdown(false); setShowProgressLogic(false);
    setShowOfficeLogicInfo(false); setShowStatusLogicInline(false); setShowOverallLogicInline(false);
    setShowCategoryLogicInline(false); setExpandedId(null);
  }, []);

  const toggleCard = useCallback((setter: (value: boolean) => void, currentValue: boolean) => {
    closeAllCards();
    if (!currentValue) setter(true);
  }, [closeAllCards]);

  useEffect(() => {
    const states = [showOverallProgress, showStatusDetails, showTotalIndicators, showReportingOffices, showAllIndicators, showCategoryStatus, showBudgetCard, showInsights];
    const openedIndex = states.findIndex(Boolean);
    if (openedIndex === -1) return;
    const setters = [setShowOverallProgress, setShowStatusDetails, setShowTotalIndicators, setShowReportingOffices, setShowAllIndicators, setShowCategoryStatus, setShowBudgetCard, setShowInsights];
    setters.forEach((setter, index) => { if (index !== openedIndex) setter(false); });
  }, [showOverallProgress, showStatusDetails, showTotalIndicators, showReportingOffices, showAllIndicators, showCategoryStatus, showBudgetCard, showInsights]);

  useEffect(() => {
    if (highlightedCard !== 'insights') return;
    closeAllCards(); setShowInsights(true);
    const timer = setTimeout(() => { insightsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
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
      const timer = setTimeout(() => { setCardsHidden(true); onCardsHidden?.(true); }, 700);
      return () => clearTimeout(timer);
    }
    setCardsHidden(false); onCardsHidden?.(false);
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
      list = list.filter((ind) => { if (!ind) return false; return normalizeCategory(ind.category) === categoryFilter; });
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
    const onTrack = indicators.filter((ind) => ind && getBreakdownStatus(ind) === 'onTrack').length;
    const needsAttention = indicators.filter((ind) => ind && getBreakdownStatus(ind) === 'needsAttention').length;
    const staleCount = indicators.filter((ind) => ind && getBreakdownStatus(ind) === 'stale').length;
    const meetingTarget = indicators.filter((ind) => { if (!ind) return false; const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0; return pct >= 80; }).length;
    const belowTarget = indicators.filter((ind) => { if (!ind) return false; const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0; return pct >= 40 && pct < 80; }).length;
    const needsCritical = indicators.filter((ind) => { if (!ind) return false; const pct = ind.annualTarget > 0 ? Math.min(100, (ind.annualProgress / ind.annualTarget) * 100) : 0; return pct < 40; }).length;
    return { total: indicators.length, onTrack, needsAttention, staleCount, meetingTarget, belowTarget, needsCritical, weightedRate: weightedAchievementRate };
  }, [indicators, weightedAchievementRate]);

  const reportingOffices = useMemo(() => {
    const emailMap = new Map<string, Set<string>>();
    indicators.forEach((ind) => {
      if (!ind || !ind.office) return;
      const email = (ind.gmail || ind.updatedBy || '').trim();
      if (email) { if (!emailMap.has(ind.office)) emailMap.set(ind.office, new Set()); emailMap.get(ind.office)!.add(email); }
    });
    return (offices || []).map((office) => ({
      office: office.name, emails: emailMap.get(office.name) || new Set(), score: office.avgCompletion ?? 0,
      avgCompletion: office.avgCompletion ?? 0, onTrack: office.onTrack ?? 0, attention: office.attention ?? 0, stale: office.stale ?? 0, total: office.total ?? 0,
    })).sort((a, b) => b.avgCompletion - a.avgCompletion);
  }, [indicators, offices]);

  const handleToggleExpand = (id: string) => { triggerHaptic('light'); setExpandedId((prev) => (prev === id ? null : id)); };
  const handleIndicatorAction = (ind: Indicator, action: 'click' | 'history' | 'comments') => {
    triggerHaptic('medium');
    if (action === 'click' && onIndicatorClick) onIndicatorClick(ind);
    else if (action === 'history' && onViewHistory) onViewHistory(ind);
    else if (action === 'comments' && onOpenComments) onOpenComments(ind);
  };

  useEffect(() => {
    if (!showAllIndicators) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (allIndicatorsRef.current && !allIndicatorsRef.current.contains(target)) setShowAllIndicators(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('touchstart', handleClickOutside); };
  }, [showAllIndicators]);

  useEffect(() => {
    if (!showSplash) return;
    const hasLang = localStorage.getItem("language");
    if (hasLang) { const timer = setTimeout(() => setShowSplash(false), 4000); return () => clearTimeout(timer); }
  }, [showSplash]);

  return (
    <div className="relative min-h-screen max-w-7xl mx-auto px-1 sm:px-4">
      {showSplash && (
        <div className="fixed inset-0 z-[9999]">
          <SplashScreen progress={stats.weightedRate} requireLanguageSelect={!localStorage.getItem("language")}
            onLanguageSelect={(lang) => { triggerHaptic('light'); setLanguage(lang); localStorage.setItem("language", lang); setTimeout(() => setShowSplash(false), 1200); }} />
        </div>
      )}
      
      <motion.div animate={{ y: cardsReachedHeader ? -220 : 0, opacity: cardsReachedHeader ? 0 : 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <AnimatePresence>
          <motion.button key="overall" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => toggleCard(setShowOverallProgress, showOverallProgress)}
            className="group relative w-full rounded-2xl border overflow-hidden transition-all duration-400 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-sm hover:shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{language === 'en' ? 'Overall Progress' : 'समग्र प्रगति'}</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-white/80">{language === 'en' ? 'Department of Roads' : 'सडक विभाग'}</p>
                </div>
                <span className="p-2 bg-white/20 rounded-xl"><Target size={28} className="text-white" /></span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="text-center"><div className="text-2xl sm:text-3xl font-black text-white">{fmt(stats.total)}</div><div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{language === 'en' ? 'Indicators' : 'सूचकहरू'}</div></div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center"><div className="text-2xl sm:text-3xl font-black text-white">{fmt(reportingOffices.length)}</div><div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{language === 'en' ? 'Offices' : 'कार्यालय'}</div></div>
                </div>
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                    <motion.circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${2 * Math.PI * 54}` }}
                      animate={{ strokeDasharray: `${2 * Math.PI * 54 * stats.weightedRate / 100} ${2 * Math.PI * 54 * (100 - stats.weightedRate) / 100}` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center"><div className="text-3xl sm:text-4xl font-black text-white">{fmt(stats.weightedRate)}%</div><div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{language === 'en' ? 'Overall' : 'समग्र'}</div></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between"><motion.div animate={{ rotate: showOverallProgress ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/70"><ChevronDown size={18} /></motion.div></div>
            </div>
          </motion.button>
        </AnimatePresence>

        <AnimatePresence>
          <motion.button key="status" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => toggleCard(setShowStatusDetails, showStatusDetails)}
            className="group relative w-full rounded-2xl border overflow-hidden transition-all duration-400 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-sm hover:shadow-xl shadow-purple-500/20 active:scale-[0.98]">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">{language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण'}</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white/70">{language === 'en' ? 'Indicators grouped by achievement level' : 'उपलब्धि स्तर अनुसार वर्गीकृत सूचकहरू'}</p>
                </div>
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg"><BarChart3 size={14} className="text-white/90" /></span>
              </div>
              <div className="flex items-end gap-3">
                <div><div className="text-2xl sm:text-3xl font-black text-emerald-200 leading-none">{fmt(stats.meetingTarget)}</div><div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5">{language === 'en' ? 'Meeting Target' : 'लक्ष्य पूरा'}</div></div>
                <div><div className="text-2xl sm:text-3xl font-black text-amber-200 leading-none">{fmt(stats.belowTarget)}</div><div className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mt-0.5">{language === 'en' ? 'Below Target' : 'लक्ष्यमुनि'}</div></div>
                <div><div className="text-2xl sm:text-3xl font-black text-rose-200 leading-none">{fmt(stats.needsCritical)}</div><div className="text-[10px] font-bold text-rose-200 uppercase tracking-wider mt-0.5">{language === 'en' ? 'Needs Attention' : 'ध्यान'}</div></div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total > 0 ? (stats.meetingTarget / stats.total) * 100 : 0}%` }} className="h-full bg-emerald-300 rounded-l-full" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total > 0 ? (stats.belowTarget / stats.total) * 100 : 0}%` }} className="h-full bg-amber-300" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats.total > 0 ? (stats.needsCritical / stats.total) * 100 : 0}%` }} className="h-full bg-rose-300 rounded-r-full" />
              </div>
              <div className="flex items-center justify-between"><motion.div animate={{ rotate: showStatusDetails ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/70"><ChevronDown size={18} /></motion.div></div>
            </div>
          </motion.button>
        </AnimatePresence>

        <AnimatePresence>
          <motion.button key="total" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => toggleCard(setShowTotalIndicators, showTotalIndicators)}
            className="group relative w-full rounded-2xl border overflow-hidden transition-all duration-400 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 shadow-sm hover:shadow-xl shadow-indigo-500/20 active:scale-[0.98]">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">{language === 'en' ? 'Total Indicators' : 'कुल सूचकहरू'}</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white/70">{language === 'en' ? 'Total number of indicators being tracked' : 'अनुगमन गरिएका कुल सूचकहरूको संख्या'}</p>
                </div>
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg"><LayoutGrid size={14} className="text-white/90" /></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white leading-none">{fmt(stats.total)}</div>
              <div className="flex items-center justify-between"><motion.div animate={{ rotate: showTotalIndicators ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/70"><ChevronDown size={18} /></motion.div></div>
            </div>
          </motion.button>
        </AnimatePresence>

        <AnimatePresence>
          <motion.button key="category" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => toggleCard(setShowCategoryStatus, showCategoryStatus)}
            className="group relative w-full rounded-2xl border overflow-hidden transition-all duration-400 bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 shadow-sm hover:shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-white/70">{language === 'en' ? 'Category Status' : 'वर्ग स्थिति'}</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white/70">{language === 'en' ? 'Completion by category' : 'वर्ग अनुसार पूरा प्रतिशत'}</p>
                </div>
                <span className="p-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg"><LayoutGrid size={14} className="text-white/90" /></span>
              </div>
              <div className="flex items-center justify-between"><motion.div animate={{ rotate: showCategoryStatus ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/70"><ChevronDown size={18} /></motion.div></div>
            </div>
          </motion.button>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};