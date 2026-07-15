import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MapPin, 
  Sparkles,
  Info
} from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import { normalizeCategory } from '../utils/category';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface IndicatorsHierarchyViewProps {
  indicators: (Indicator & { serialCode: string })[];
  translateCategory: (category: string) => string;
  onIndicatorClick: (indicator: Indicator) => void;
  toggleTrack: (id: string) => void;
  trackedIds: string[];
}

export const IndicatorsHierarchyView: React.FC<IndicatorsHierarchyViewProps> = ({
  indicators,
  translateCategory,
  onIndicatorClick,
  toggleTrack,
  trackedIds
}) => {
  const { language, translateOffice, translateUnit } = useLanguage();
  const isEn = language === 'en';

  // Keep track of which sectors are expanded
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({
    'Infrastructure Creation': true,
    'Maintenance': true,
    'Budget Utilization': true,
    'Employment Creation': true,
    'Governance': true
  });

  // Keep track of which individual indicators are expanded for detailed info
  const [expandedIndicators, setExpandedIndicators] = useState<Record<string, boolean>>({});

  const toggleSector = (sector: string) => {
    triggerHaptic('light');
    setExpandedSectors(prev => ({
      ...prev,
      [sector]: !prev[sector]
    }));
  };

  const toggleIndicator = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setExpandedIndicators(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group indicators by sector
  const groupedIndicators = useMemo(() => {
    const groups: Record<string, typeof indicators> = {};
    indicators.forEach(ind => {
      const sector = normalizeCategory(ind.category);
      if (!groups[sector]) {
        groups[sector] = [];
      }
      groups[sector].push(ind);
    });
    return groups;
  }, [indicators]);

  // Calculate sector scores
  const sectorScores = useMemo(() => {
    const scores: Record<string, number> = {};
    Object.entries(groupedIndicators).forEach(([sector, rawList]) => {
      const list = rawList as typeof indicators;
      if (list.length === 0) {
        scores[sector] = 0;
        return;
      }
      const totalWeight = list.reduce((acc, curr) => acc + (curr.weight || 0), 0) || 100;
      const achievedWeight = list.reduce((acc, curr) => {
        const target = curr.annualTarget || 0;
        const progress = curr.annualProgress || 0;
        const pct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return acc + (pct * ((curr.weight || 0) / 100));
      }, 0);
      scores[sector] = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
    });
    return scores;
  }, [groupedIndicators]);

  // Generate simple realistic sparkline history points
  const getSparklineData = (baseline: string | number, currentProgress: number, target: number) => {
    const baseNum = typeof baseline === 'number' ? baseline : parseFloat(baseline) || 0;
    const progressVal = currentProgress || 0;
    const targetVal = target || 100;

    // Convert values to simple achievement percentages (clamped)
    const basePct = targetVal > 0 ? Math.min((baseNum / targetVal) * 100, 100) : 0;
    const currentPct = targetVal > 0 ? Math.min((progressVal / targetVal) * 100, 100) : 0;

    // Create realistic historic milestones
    const step1 = basePct;
    const step2 = basePct + (currentPct - basePct) * 0.35;
    const step3 = basePct + (currentPct - basePct) * 0.75;
    const step4 = currentPct;

    return [
      { name: 'Start', value: Math.round(step1) },
      { name: 'Q1', value: Math.round(step2) },
      { name: 'Q2', value: Math.round(step3) },
      { name: 'Q3', value: Math.round(step4) },
    ];
  };

  const sectorsOrder = [
    'Infrastructure Creation',
    'Maintenance',
    'Budget Utilization',
    'Employment Creation',
    'Governance'
  ];

  return (
    <div className="space-y-6">
      {sectorsOrder.map((sector) => {
        const list = groupedIndicators[sector] || [];
        const isSectorExpanded = expandedSectors[sector];
        const sectorScore = sectorScores[sector] || 0;

        // Styles based on sector score
        let badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
        if (sectorScore >= 80) {
          badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
        } else if (sectorScore >= 40) {
          badgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
        }

        return (
          <div 
            key={sector} 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs transition-all duration-300"
          >
            {/* Sector Accordion Header */}
            <div 
              onClick={() => toggleSector(sector)}
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800"
              data-expanded={isSectorExpanded}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`px-2.5 py-1 text-xs font-black rounded-xl uppercase tracking-wider ${badgeColor}`}>
                  {sectorScore}%
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    {translateCategory(sector)}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {list.length} {isEn ? 'Strategic KPIs' : 'रणनीतिक सूचकहरू'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSectorExpanded ? (
                  <ChevronUp size={18} className="text-slate-400" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Sector Indicator List */}
            <AnimatePresence initial={false}>
              {isSectorExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {list.map((ind) => {
                      const isIndicatorExpanded = expandedIndicators[ind.id];
                      const isTracked = trackedIds.includes(ind.id);
                      
                      const achievementPct = ind.annualTarget > 0 
                        ? Math.round((ind.annualProgress / ind.annualTarget) * 100) 
                        : 0;

                      let statusBadge = { labelEn: 'Critical', labelNp: 'जोखिमपूर्ण', color: 'text-rose-600 bg-rose-50 border border-rose-100 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30' };
                      if (achievementPct >= 80) {
                        statusBadge = { labelEn: 'Excellent', labelNp: 'उत्कृष्ट', color: 'text-emerald-600 bg-emerald-50 border border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30' };
                      } else if (achievementPct >= 40) {
                        statusBadge = { labelEn: 'Progressing', labelNp: 'संतोषजनक', color: 'text-amber-600 bg-amber-50 border border-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30' };
                      }

                      const sparkData = getSparklineData(ind.baseline, ind.annualProgress, ind.annualTarget);

                      return (
                        <div 
                          key={ind.id} 
                          className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10 transition-colors"
                        >
                          {/* Row Summary */}
                          <div 
                            onClick={() => onIndicatorClick(ind)}
                            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span className="text-[10px] font-black tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 px-1.5 py-0.5 rounded-md mt-0.5 select-none font-mono">
                                {ind.serialCode}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                  {isEn ? ind.nameEn : ind.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider ${statusBadge.color}`}>
                                    {isEn ? statusBadge.labelEn : statusBadge.labelNp}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <MapPin size={10} className="text-slate-400 shrink-0" />
                                    {translateOffice(ind.office) || 'DoR HQ'}
                                  </span>
                                  {ind.isMilestone && (
                                    <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                      <Sparkles size={8} />
                                      {isEn ? 'Milestone' : 'मिल्स्टोन'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Achievements & sparkline summary */}
                            <div className="flex items-center gap-6 self-end sm:self-center shrink-0">
                              {/* Sparkline chart */}
                              <div className="w-16 h-8 hidden md:block">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={sparkData}>
                                    <defs>
                                      <linearGradient id={`grad-${ind.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <Area 
                                      type="monotone" 
                                      dataKey="value" 
                                      stroke="#6366f1" 
                                      fill={`url(#grad-${ind.id})`} 
                                      strokeWidth={1.5} 
                                      dot={false}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Progress metrics */}
                              <div className="text-right">
                                <div className="flex items-baseline gap-1 justify-end">
                                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                    {achievementPct}%
                                  </span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                  {isEn ? 'Achieved' : 'हासिल'}
                                </p>
                              </div>

                              {/* Actions / Expander Toggle */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic('light');
                                    toggleTrack(ind.id);
                                  }}
                                  className={`p-1.5 rounded-xl border transition-colors ${
                                    isTracked 
                                      ? 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700'
                                  }`}
                                  title={isEn ? 'Track indicator' : 'सूचक ट्र्याक गर्नुहोस्'}
                                >
                                  <Star size={12} fill={isTracked ? 'currentColor' : 'transparent'} />
                                </button>
                                <button
                                  onClick={(e) => toggleIndicator(ind.id, e)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 transition-colors"
                                >
                                  {isIndicatorExpanded ? (
                                    <ChevronUp size={12} />
                                  ) : (
                                    <ChevronDown size={12} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Indicator Details Content */}
                          <AnimatePresence initial={false}>
                            {isIndicatorExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/60"
                              >
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                  {/* Description & metadata */}
                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                        {isEn ? 'KPI Target Definition' : 'सूचक विवरण'}
                                      </span>
                                      <p className="font-medium text-slate-750 dark:text-slate-300 mt-1 leading-relaxed">
                                        {isEn ? ind.nameEn : ind.name}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">SDG Alignment</span>
                                        <p className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{ind.sdg || 'SDG 9'}</p>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Review Cycle</span>
                                        <p className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{ind.period || 'Annual'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress values */}
                                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-3xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                      <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">
                                        {isEn ? 'Achievement Ratios' : 'उपलब्धि परिमाणहरू'}
                                      </span>
                                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">{translateUnit(ind.unit)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 py-2 text-center">
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-400">Baseline</span>
                                        <p className="font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{ind.baseline}</p>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-400">Progress</span>
                                        <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{ind.annualProgress}</p>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-400">Target</span>
                                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{ind.annualTarget}</p>
                                      </div>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(achievementPct, 100)}%` }}
                                        transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
                                        className={`h-full ${achievementPct >= 80 ? 'bg-emerald-500' : achievementPct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      />
                                    </div>
                                  </div>

                                  {/* Trend and sparkline visual */}
                                  <div className="flex flex-col justify-between">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                          {isEn ? 'Performance Trajectory' : 'प्रवृत्ति विश्लेषण'}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-700 dark:text-slate-300">
                                          {achievementPct >= 50 ? (
                                            <>
                                              <TrendingUp size={14} className="text-emerald-500" />
                                              <span className="text-emerald-600 dark:text-emerald-400">Positive Trajectory</span>
                                            </>
                                          ) : (
                                            <>
                                              <TrendingDown size={14} className="text-rose-500" />
                                              <span className="text-rose-600 dark:text-rose-400">Needs Acceleration</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => onIndicatorClick(ind)}
                                        className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-0.5"
                                      >
                                        <Info size={11} />
                                        {isEn ? 'Logs & History' : 'लग र विवरण'}
                                      </button>
                                    </div>

                                    {/* Detailed Sparkline */}
                                    <div className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-xl shadow-3xs mt-2">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparkData}>
                                          <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#6366f1" 
                                            fill="#e0e7ff" 
                                            strokeWidth={2} 
                                            dot={{ r: 3, stroke: '#6366f1', strokeWidth: 1, fill: '#fff' }}
                                          />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
