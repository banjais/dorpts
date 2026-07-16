import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator, SystemMetadata } from '../types';
import { getStatusBadge } from '../utils/status';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Target, AlertTriangle, Clock, Info, Calendar, RefreshCw, Database, Building2, User, BarChart2, LayoutGrid, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { StatusGuideModal } from './StatusGuideModal';
import { KPISummaryChart } from './KPISummaryChart';
import { PortfolioHealthChart } from './PortfolioHealthChart';
import { HISTORICAL_DATA } from '../historicalData';

// A module-level cache of previous values to ensure smooth counting across re-renders and re-mounts
const previousValuesCache: Record<string, number> = {};

interface AnimatedNumberProps {
  id: string;
  value: number;
  suffix?: string;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ id, value, suffix = '', className = '' }) => {
  const initialValue = previousValuesCache[id] !== undefined ? previousValuesCache[id] : 0;
  const [displayValue, setDisplayValue] = useState(initialValue);
  const prevValueRef = useRef(initialValue);

  useEffect(() => {
    let animationFrameId: number;
    const start = performance.now();
    const duration = 800; // 800ms
    const from = prevValueRef.current;
    const to = value;

    if (from === to) {
      setDisplayValue(to);
      previousValuesCache[id] = to;
      return;
    }

    const animateStep = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * easeProgress;
      
      const roundedVal = Math.round(current);
      setDisplayValue(roundedVal);
      previousValuesCache[id] = roundedVal;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateStep);
      } else {
        prevValueRef.current = to;
        previousValuesCache[id] = to;
      }
    };

    animationFrameId = requestAnimationFrame(animateStep);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, id]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={`${id}-${value}`}
        initial={{ opacity: 0, y: -4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={`inline-block ${className}`}
      >
        {displayValue}{suffix}
      </motion.span>
    </AnimatePresence>
  );
};

interface CardProps {
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  onViewActivityDetail?: () => void;
}

export const KpiSummaryCard: React.FC<CardProps> = ({ indicators, metadata, onViewActivityDetail }) => {
  const { language, t } = useLanguage();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [viewType, setViewType] = useState<'cards' | 'pie' | 'bar' | 'indicators'>('bar');

  const stats = indicators.reduce((acc, ind) => {
    if (!ind) return acc;
    const percent = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
    const { status } = getStatusBadge(percent, t);
    acc[status] += 1;
    acc.totalProgress += ind.annualProgress;
    acc.totalTarget += ind.annualTarget;
    return acc;
  }, { excellent: 0, onTrack: 0, progressing: 0, atRisk: 0, delayed: 0, totalProgress: 0, totalTarget: 0 });

  const sparklineData = useMemo(() => {
    const snap1 = HISTORICAL_DATA[0] || { indicators: [] };
    const snap2 = HISTORICAL_DATA[1] || { indicators: [] };

    const getStatsForSnapshot = (snapshotIndicators: any[]) => {
      return (indicators || []).reduce((acc, ind) => {
        if (!ind) return acc;
        const histInd = (snapshotIndicators || []).find(h => h && (h.id === ind.id || h.name === ind.name || h.name === ind.nameEn));
        const progress = histInd ? histInd.annualProgress : 0;
        const target = histInd ? histInd.annualTarget : ind.annualTarget;
        const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
        
        const { status } = getStatusBadge(percent, t);

        acc[status] += 1;
        return acc;
      }, { excellent: 0, onTrack: 0, progressing: 0, atRisk: 0, delayed: 0 });
    };

    const stats1 = getStatsForSnapshot(snap1.indicators);
    const stats2 = getStatsForSnapshot(snap2.indicators);

    return {
      excellent: [
        { value: stats1.excellent },
        { value: stats2.excellent },
        { value: stats.excellent }
      ],
      onTrack: [
        { value: stats1.onTrack },
        { value: stats2.onTrack },
        { value: stats.onTrack }
      ],
      progressing: [
        { value: stats1.progressing },
        { value: stats2.progressing },
        { value: stats.progressing }
      ],
      atRisk: [
        { value: stats1.atRisk },
        { value: stats2.atRisk },
        { value: stats.atRisk }
      ],
      delayed: [
        { value: stats1.delayed },
        { value: stats2.delayed },
        { value: stats.delayed }
      ]
    };
  }, [indicators, stats]);

  const progressPercent = stats.totalTarget > 0 ? Math.min(100, Math.round((stats.totalProgress / stats.totalTarget) * 100)) : 0;

  const gaugeData = [
    { value: progressPercent },
    { value: 100 - progressPercent }
  ];

  // Sort indicators log to show explicitly edited indicators first, then alphabetical/importance
  const sortedIndicatorsLog = useMemo(() => {
    return [...indicators].filter(Boolean).sort((a, b) => {
      if (a.updatedAt && !b.updatedAt) return -1;
      if (!a.updatedAt && b.updatedAt) return 1;
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });
  }, [indicators]);

  const formatIndicatorDate = (dateStr?: string) => {
    if (!dateStr) return metadata?.lastUpdateDate || '2083/02/30';
    try {
      if (dateStr.includes('T') || dateStr.includes('-')) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(language === 'en' ? 'en-US' : 'ne-NP', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-xl p-4 sm:p-6 border border-indigo-150 dark:border-indigo-950/60 shadow-sm relative overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-800 col-span-12 flex flex-col justify-between" id="kpi-summary-portfolio-card">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
               <h3 className="text-base font-black text-slate-800 dark:text-slate-100 font-display">{t('kpiSummary')}</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('portfolioHealth')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewType('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'cards' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                title={t('cardView')}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewType('pie')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'pie' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                title={`${t('portfolioHealth')} (Pie)`}
              >
                <PieChartIcon size={16} />
              </button>
              <button
                onClick={() => setViewType('bar')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                title={`${t('portfolioHealth')} (Bar)`}
              >
                <BarChart2 size={16} />
              </button>
              <button
                onClick={() => setViewType('indicators')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'indicators' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                title={t('kpiSummary')}
              >
                <Database size={16} />
              </button>
            </div>
            <button
              onClick={() => setIsGuideOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            id="status-guide-trigger"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {viewType === 'cards' ? (
                <motion.div 
                  key="kpi-cards"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
                >
                  {/* Excellent KPI Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center flex flex-col justify-between items-center h-32"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
                        <AnimatedNumber id="excellent-count" value={stats.excellent} />
                      </div>
                      <div className="text-[7px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">{t('excellent')}</div>
                      <div className="text-[9px] font-black text-emerald-600/60 mt-1">
                        <AnimatedNumber id="excellent-percent" value={indicators.length > 0 ? Math.round((stats.excellent / indicators.length) * 100) : 0} suffix="%" />
                      </div>
                    </div>
                    <div className="h-7 w-full mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData.excellent} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                          <defs>
                            <linearGradient id="sparklineExcellentGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.8} fillOpacity={1} fill="url(#sparklineExcellentGrad)" dot={{ r: 1.5, fill: '#10b981', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
      
                  {/* On Track KPI Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center flex flex-col justify-between items-center h-32"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-blue-900 dark:text-blue-100">
                        <AnimatedNumber id="on-track-count" value={stats.onTrack} />
                      </div>
                      <div className="text-[7px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">{t('onTrack')}</div>
                      <div className="text-[9px] font-black text-blue-600/60 mt-1">
                        <AnimatedNumber id="on-track-percent" value={indicators.length > 0 ? Math.round((stats.onTrack / indicators.length) * 100) : 0} suffix="%" />
                      </div>
                    </div>
                    <div className="h-7 w-full mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData.onTrack} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                          <defs>
                            <linearGradient id="sparklineOnTrackGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.8} fillOpacity={1} fill="url(#sparklineOnTrackGrad)" dot={{ r: 1.5, fill: '#3b82f6', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
      
                  {/* Progressing KPI Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-center flex flex-col justify-between items-center h-32"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-indigo-900 dark:text-indigo-100">
                        <AnimatedNumber id="progressing-count" value={stats.progressing} />
                      </div>
                      <div className="text-[7px] text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">{t('progressing')}</div>
                      <div className="text-[9px] font-black text-indigo-600/60 mt-1">
                        <AnimatedNumber id="progressing-percent" value={indicators.length > 0 ? Math.round((stats.progressing / indicators.length) * 100) : 0} suffix="%" />
                      </div>
                    </div>
                    <div className="h-7 w-full mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData.progressing} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                          <defs>
                            <linearGradient id="sparklineProgressingGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.8} fillOpacity={1} fill="url(#sparklineProgressingGrad)" dot={{ r: 1.5, fill: '#6366f1', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
      
                  {/* At Risk KPI Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center flex flex-col justify-between items-center h-32"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-amber-900 dark:text-amber-100">
                        <AnimatedNumber id="at-risk-count" value={stats.atRisk} />
                      </div>
                      <div className="text-[7px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">{t('atRisk')}</div>
                      <div className="text-[9px] font-black text-amber-600/60 mt-1">
                        <AnimatedNumber id="at-risk-percent" value={indicators.length > 0 ? Math.round((stats.atRisk / indicators.length) * 100) : 0} suffix="%" />
                      </div>
                    </div>
                    <div className="h-7 w-full mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData.atRisk} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                          <defs>
                            <linearGradient id="sparklineAtRiskGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.8} fillOpacity={1} fill="url(#sparklineAtRiskGrad)" dot={{ r: 1.5, fill: '#f59e0b', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
      
                  {/* Delayed KPI Card */}
                  <motion.div 
                    whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center flex flex-col justify-between items-center h-32"
                  >
                    <div>
                      <div className="text-lg font-extrabold text-red-900 dark:text-red-100">
                        <AnimatedNumber id="delayed-count" value={stats.delayed} />
                      </div>
                      <div className="text-[7px] text-red-700 dark:text-red-300 font-bold uppercase tracking-wider">{t('delayed')}</div>
                      <div className="text-[9px] font-black text-red-600/60 mt-1">
                        <AnimatedNumber id="delayed-percent" value={indicators.length > 0 ? Math.round((stats.delayed / indicators.length) * 100) : 0} suffix="%" />
                      </div>
                    </div>
                    <div className="h-7 w-full mt-2 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData.delayed} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                          <defs>
                            <linearGradient id="sparklineDelayedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={1.8} fillOpacity={1} fill="url(#sparklineDelayedGrad)" dot={{ r: 1.5, fill: '#ef4444', strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </motion.div>
              ) : viewType === 'bar' ? (
                <motion.div
                  key="kpi-bar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-center"
                >
                  <PortfolioHealthChart indicators={indicators} t={t} mode="bar" />
                </motion.div>
              ) : viewType === 'pie' ? (
                <motion.div
                  key="kpi-pie"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-center"
                >
                  <PortfolioHealthChart indicators={indicators} t={t} mode="pie" />
                </motion.div>
              ) : (
                <motion.div
                  key="kpi-indicators"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <KPISummaryChart indicators={indicators} t={t} language={language} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="lg:col-span-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="h-20 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={30}
                    outerRadius={40}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                <AnimatedNumber id="overall-progress-percent" value={progressPercent} suffix="%" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t('targetProgress')}</div>
            </div>
          </div>
        </div>
      </div>



      <StatusGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};
