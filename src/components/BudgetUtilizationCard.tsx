import React from 'react';
import { Indicator } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Edit3, Wallet, History, TrendingUp, TrendingDown, Bell, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { normalizeCategory, getCategoryColor } from '../utils/category';
import { getStatusBadge } from '../utils/status';
import { highlightText } from '../utils/highlight';

interface CardProps {
  indicator: Indicator;
  onEdit: (indicator: Indicator) => void;
  onViewHistory?: (indicator: Indicator) => void;
  updatesHistory?: any[];
  isTracked?: boolean;
  onToggleTrack?: () => void;
  onClick?: (indicator: Indicator) => void;
  onOpenComments?: (indicator: Indicator) => void;
  categoryThemes?: Record<string, string>;
  searchQuery?: string;
}

export const BudgetUtilizationCard = React.memo<CardProps>(({ 
  indicator, 
  onEdit, 
  onViewHistory, 
  updatesHistory = [], 
  isTracked = false, 
  onToggleTrack, 
  onClick, 
  onOpenComments, 
  categoryThemes,
  searchQuery = ""
}) => {
  const { isAdmin } = useAuth();
  const { language, t, translateUnit } = useLanguage();
  
  const catColor = getCategoryColor(indicator.category, categoryThemes);

  const spent = indicator.annualProgress;
  const total = indicator.annualTarget;
  const remaining = Math.max(0, total - spent);
  const percentSpent = total > 0 ? Math.round((spent / total) * 100) : 0;
  // Budget utilization is inverted: higher spent means lower "progress" in budget, 
  // but status badge usually means how much we've accomplished. 
  // Let's use 100 - percentSpent as the "progress"
  const status = getStatusBadge(Math.max(0, 100 - percentSpent), t);

  const primaryName = language === 'en' ? (indicator.nameEn || indicator.name) : indicator.name;
  const secondaryName = language === 'en' ? indicator.name : (indicator.nameEn || indicator.name);

  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showFastLook, setShowFastLook] = React.useState(false);

  const startPress = React.useCallback((e: any) => {
    if (e.button && e.button !== 0) return;

    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest("input")
    ) {
      return;
    }

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    pressTimerRef.current = setTimeout(() => {
      if (onClick) {
        onClick(indicator);
      }
      setShowFastLook(true);
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        window.navigator.vibrate(50);
      }
    }, 550);
  }, [onClick, indicator]);

  const endPress = React.useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setShowFastLook(false);
  }, []);

  // Extract and calculate sparkline points
  const sparklineData = React.useMemo(() => {
    if (!updatesHistory || !indicator) return [];

    const extracted = updatesHistory
      .map(historyItem => {
        const indSnap = historyItem.indicators?.find((i: any) => i.id === indicator.id);
        if (!indSnap) return null;

        return {
          id: historyItem.id,
          annualProgress: indSnap.annualProgress || 0,
          updatedAt: indSnap.updatedAt || historyItem.createdAt || '',
        };
      })
      .filter(Boolean) as any[];

    const hasCurrentInHistory = extracted.some(
      log => log.annualProgress === indicator.annualProgress && 
             new Date(log.updatedAt).toLocaleDateString() === new Date(indicator.updatedAt || '').toLocaleDateString()
    );

    if (!hasCurrentInHistory && indicator.updatedAt) {
      extracted.unshift({
        id: 'current-live',
        annualProgress: indicator.annualProgress,
        updatedAt: indicator.updatedAt,
      });
    }

    // Sort chronologically (most recent first)
    const sorted = extracted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Take last 5 updates and reverse to get oldest-to-newest chronological order
    return sorted.slice(0, 5).reverse();
  }, [indicator, updatesHistory]);

  const displayPoints = React.useMemo(() => {
    const points = sparklineData.map(d => d.annualProgress);
    return points.length === 1 
      ? [0, points[0]] 
      : points;
  }, [sparklineData]);

  const minVal = Math.min(...displayPoints);
  const maxVal = Math.max(...displayPoints);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const width = 120;
  const height = 30;
  const padding = 2;

  // Map each value to SVG coordinates
  const svgPoints = React.useMemo(() => {
    return displayPoints.map((val, idx) => {
      const x = padding + (idx / (displayPoints.length - 1 || 1)) * (width - 2 * padding);
      const y = padding + (1 - (val - minVal) / valRange) * (height - 2 * padding);
      return { x, y, val };
    });
  }, [displayPoints, minVal, valRange]);

  // Generate path strings
  const linePath = React.useMemo(() => {
    return svgPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [svgPoints]);

  const areaPath = React.useMemo(() => {
    return svgPoints.length > 0 
      ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height} L ${svgPoints[0].x} ${height} Z` 
      : '';
  }, [svgPoints, linePath]);

  const startVal = displayPoints[0] || 0;
  const endVal = displayPoints[displayPoints.length - 1] || 0;
  const isTrendUp = endVal > startVal;
  const isTrendDown = endVal < startVal;
  
  const changePercentage = startVal > 0 
    ? Math.round(((endVal - startVal) / startVal) * 100) 
    : endVal > 0 ? 100 : 0;

  const trendText = React.useMemo(() => {
    if (isTrendUp) {
      return language === 'en' 
        ? `+${changePercentage}% Accelerating` 
        : `+${changePercentage}% तीव्र गति`;
    } else if (isTrendDown) {
      return language === 'en' 
        ? `${changePercentage}% Decelerating` 
        : `${changePercentage}% मन्द गति`;
    } else {
      return language === 'en' ? 'Stable Progress' : 'स्थिर प्रगति';
    }
  }, [isTrendUp, isTrendDown, changePercentage, language]);

  if (!indicator) return null;

  return (
    <motion.div 
      id={`budget-card-${indicator.id}`}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onContextMenu={(e) => {
        if (showFastLook) {
          e.preventDefault();
        }
      }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between h-full transition-all duration-300 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md select-none cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2" style={{ color: catColor.hex }}>
            <Wallet size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('budget')}</span>
          </div>
          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleTrack && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleTrack();
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                isTracked 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40' 
                  : 'bg-transparent text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800'
              }`}
              title={
                isTracked 
                  ? (language === 'en' ? 'Stop tracking / alerting' : 'ट्र्याकिङ / अलर्ट बन्द गर्नुहोस्') 
                  : (language === 'en' ? 'Track indicator / enable alerts' : 'सूचक ट्र्याक गर्नुहोस् / अलर्ट सक्रिय गर्नुहोस्')
              }
              id={`track-btn-budget-${indicator.id}`}
            >
              <Bell size={14} className={isTracked ? 'fill-amber-650 dark:fill-amber-400' : ''} />
            </button>
          )}
          {onViewHistory && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(indicator);
              }}
              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
              title={language === 'en' ? 'View history log' : 'इतिहास विवरण हेर्नुहोस्'}
              id={`history-btn-budget-${indicator.id}`}
            >
              <History size={14} />
            </button>
          )}
          {onOpenComments && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(indicator);
              }}
              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
              title={language === 'en' ? 'Comments & discussion' : 'टिप्पणी र छलफल'}
              id={`comments-btn-budget-${indicator.id}`}
            >
              <MessageSquare size={14} />
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => onEdit(indicator)}
              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
          {highlightText(primaryName, searchQuery)}
        </h4>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">
          {highlightText(secondaryName, searchQuery)}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-[9px] text-slate-400 block uppercase">{t('spent')}</span>
          <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 font-mono">
            {spent.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block uppercase">{t('remaining')}</span>
          <span className="text-[14px] font-bold text-amber-600 dark:text-amber-400 font-mono">
            {remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* PERFORMANCE TREND SPARKLINE */}
      {sparklineData.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-amber-50/20 dark:bg-amber-950/10 p-2 rounded-xl border border-amber-200/20 dark:border-amber-900/10">
          <div className="text-left">
            <span className="text-[8.5px] text-slate-450 dark:text-slate-500 block font-sans uppercase tracking-wider">
              {language === 'en' ? 'Utilization Trend (Last 5)' : 'खर्च प्रवृत्ति (अन्तिम ५)'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {isTrendUp ? (
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 leading-none">
                  <TrendingUp size={11} className="shrink-0" />
                  {trendText}
                </span>
              ) : isTrendDown ? (
                <span className="text-[10px] font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-0.5 leading-none">
                  <TrendingDown size={11} className="shrink-0" />
                  {trendText}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">
                  {trendText}
                </span>
              )}
            </div>
          </div>

          {/* Sparkline Vector Graphic */}
          <div className="h-6 w-[100px] relative overflow-visible flex items-center">
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
              <defs>
                <linearGradient id={`sparkline-grad-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isTrendUp ? '#d97706' : isTrendDown ? '#f43f5e' : '#6366f1'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={isTrendUp ? '#d97706' : isTrendDown ? '#f43f5e' : '#6366f1'} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Gradient Area */}
              {areaPath && (
                <path 
                  d={areaPath} 
                  fill={`url(#sparkline-grad-${indicator.id})`} 
                  stroke="none" 
                />
              )}
              
              {/* Smooth Line Path */}
              {linePath && (
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  d={linePath} 
                  fill="none" 
                  stroke={isTrendUp ? '#d97706' : isTrendDown ? '#f43f5e' : '#6366f1'} 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Pulsing Dot at the latest point */}
              {svgPoints.length > 0 && (
                <circle 
                  cx={svgPoints[svgPoints.length - 1].x} 
                  cy={svgPoints[svgPoints.length - 1].y} 
                  r="2.5" 
                  fill={isTrendUp ? '#d97706' : isTrendDown ? '#f43f5e' : '#6366f1'} 
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Visualization */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{percentSpent}% {t('utilized')}</span>
          <span>{total.toLocaleString()} {t('total')}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <motion.div 
            className="h-full" 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentSpent, 100)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.1 }}
            style={{ backgroundColor: catColor.hex }} 
          />
          <motion.div 
            className="bg-amber-400 h-full" 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, 100 - percentSpent)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
          />
        </div>
      </div>

      {/* HISTORICAL MILESTONES */}
      {sparklineData.length > 0 && (
        <div className="mt-4 pt-2 border-t border-amber-50 dark:border-amber-900/10">
          <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-wider mb-2">
            {language === 'en' ? 'Historical Milestones' : 'ऐतिहासिक माइलस्टोनहरू'}
          </span>
          <div className="flex flex-wrap gap-2">
            {sparklineData.map((milestone, idx) => (
              <div key={idx} className="flex flex-col bg-amber-50/30 dark:bg-amber-900/10 px-2 py-1 rounded-lg border border-amber-100/30 dark:border-amber-900/10 min-w-[55px]">
                <span className="text-[7.5px] text-slate-450 dark:text-slate-500 leading-none">
                  {new Date(milestone.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 mt-1 font-mono">
                  {milestone.annualProgress}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});
