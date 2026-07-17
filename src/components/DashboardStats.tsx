import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Indicator, SystemMetadata, ViewMode, Toast } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DataHealthMonitor } from './DataHealthMonitor';
import { Target, Info, LayoutGrid, Shield, TrendingUp, Building2, CheckCircle2, ExternalLink, X, ChevronRight, Activity, Volume2, Mic, MicOff } from 'lucide-react';
import { speak, getMuted } from '../utils/speech';
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip, AreaChart, Area, XAxis, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { HISTORICAL_DATA } from '../historicalData';
import { getSectorForIndicator, DOR_OFFICES_LIST } from '../data';
import { triggerHaptic } from '../utils/haptic';
import { VoiceHelpModal } from './VoiceHelpModal';
import { RadialPerformanceChart } from './RadialPerformanceChart';

import { MetricsChart } from './MetricsChart';

interface DashboardStatsProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  activeMetric: string | null;
  updatesHistory?: any[];
  onOpenAbout?: (tab?: string) => void;
  onOpenDataHealth?: () => void;
  setViewMode?: (mode: ViewMode) => void;
  setCategoryFilter?: (category: string) => void;
  addToast?: (toast: Toast) => void;
}

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
};

const AnimatedNumber: React.FC<{
  value: number;
  isNepali: boolean;
  suffix?: string;
  className?: string;
}> = ({ value, isNepali, suffix = '', className = '' }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const display = useTransform(rounded, (val) => isNepali ? toNepaliNumerals(val.toString()) : val.toString());

  React.useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span className={className}>{display}{suffix}</motion.span>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const CustomSparklineTooltip = ({ active, payload, language, translateUnit, unit, isPercentage }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const val = data.value;
    
    let displayValue = '';
    const formattedVal = typeof val === 'number' 
      ? (language === 'np' ? toNepaliNumerals(val.toLocaleString()) : val.toLocaleString())
      : val;

    const actualIsPercentage = isPercentage ?? data.isPercentage ?? true;

    if (actualIsPercentage) {
      displayValue = `${formattedVal}%`;
    } else if (unit) {
      displayValue = `${formattedVal} ${translateUnit(unit)}`;
    } else {
      displayValue = String(formattedVal);
    }

    const rawDate = data.date || '2082/04/01';
    let displayDate = rawDate;
    if (language === 'np') {
      displayDate = toNepaliNumerals(rawDate);
    }

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 dark:border-white/10 px-2.5 py-1.5 rounded-xl shadow-xl text-[10px] text-white font-medium pointer-events-none backdrop-blur-sm z-50">
        <div className="font-extrabold text-indigo-400">
          {language === 'en' ? 'Progress' : 'प्रगति'}: {displayValue}
        </div>
        <div className="text-slate-300 font-semibold mt-0.5">
          {language === 'en' ? 'Date' : 'मिति'}: {displayDate}
        </div>
      </div>
    );
  }
  return null;
};

const CustomOverallChartTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/50 dark:border-white/10 p-3 rounded-2xl shadow-2xl text-[11px] text-white backdrop-blur-md z-50">
        <p className="font-extrabold text-indigo-400 mb-1.5 leading-tight">
          {language === 'en' ? data.labelEn : data.labelNp}
        </p>
        <div className="space-y-1 pt-1.5 border-t border-white/5">
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-400 font-semibold">{language === 'en' ? 'Date' : 'मिति'}:</span>
            <span className="font-bold">{language === 'en' ? data.date : toNepaliNumerals(data.date)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-400 font-semibold">{language === 'en' ? 'Achievement' : 'उपलब्धि'}:</span>
            <span className="font-black text-indigo-300">{language === 'en' ? `${data.progress}%` : `${toNepaliNumerals(data.progress)}%`}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Sparkline: React.FC<{ 
  data: any[]; 
  color: string;
  unit?: string;
  isPercentage?: boolean;
  language: 'en' | 'np';
  translateUnit: (unit: string) => string;
  delay?: number;
}> = ({ data, color, unit, isPercentage, language, translateUnit, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        type: 'spring',
        stiffness: 120,
        damping: 12
      }}
      className="h-8 w-16 sm:w-20"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} onMouseEnter={() => triggerHaptic('light')}>
          <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip 
            content={<CustomSparklineTooltip language={language} translateUnit={translateUnit} unit={unit} isPercentage={isPercentage} />} 
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '2 2' }}
            allowEscapeViewBox={{ x: true, y: true }}
            position={{ y: -45 }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 3, strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

interface StatCardProps {
  stat: any;
  activeMetric: string | null;
  language: 'en' | 'np';
  translateUnit: (unit: string) => string;
  variant?: 'summary' | 'sector' | 'indicator';
  delay?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ stat, activeMetric, language, translateUnit, variant = 'indicator', delay = 0, onClick }) => {
  const isSummary = variant === 'summary';
  const isSector = variant === 'sector';
  const isClickable = !!onClick;
  
  return (
    <motion.div
      layout
      key={stat.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: activeMetric && activeMetric !== stat.id ? 0.4 : 1, 
        scale: activeMetric === stat.id ? 1.02 : 1,
        zIndex: activeMetric === stat.id ? 10 : 1,
        borderColor: activeMetric === stat.id ? '#4f46e5' : 'transparent',
      }}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative flex flex-col justify-between transition-all duration-500 min-h-[150px] sm:min-h-[180px] rounded-[32px] border ${
        isSummary 
          ? 'bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-6 border border-indigo-150 dark:border-indigo-950/60 shadow-sm relative overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-800' 
          : isSector
            ? 'bg-white dark:bg-slate-900 p-4 sm:p-6 border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700'
            : 'bg-white dark:bg-slate-900 p-4 sm:p-5 border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700'
      } ${isClickable ? 'cursor-pointer active:scale-95 hover:border-indigo-500/50 group/card' : ''}`}
    >
      {isSummary && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={`p-2 rounded-xl border ${
          isSummary 
            ? 'bg-white/10 border-white/10 text-white' 
            : stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-100/50' :
              stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-100/50' :
              stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-100/50' :
              stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-100/50' :
              stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-100/50' :
              'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100'
        }`}>
          {React.cloneElement(stat.icon as React.ReactElement, { size: 16 })}
        </div>
        <div className="flex items-center gap-1.5">
          {isClickable && (
            <div className={`p-1 rounded-full ${isSummary ? 'bg-white/10' : 'bg-indigo-50 dark:bg-indigo-900/30'} opacity-0 group-hover/card:opacity-100 transition-opacity`}>
              <ExternalLink size={10} className={isSummary ? 'text-white' : 'text-indigo-500'} />
            </div>
          )}
          <span className={`text-[0.5625rem] font-black uppercase tracking-widest ${isSummary ? 'opacity-40' : 'text-slate-400'}`}>
            {stat.id.toString().startsWith('ind_') ? stat.id.replace('ind_', 'ID ') : 'SYS'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <h3 className={`text-xs sm:text-sm font-black mb-1 flex items-center gap-1 group ${isSummary ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
          <span className="line-clamp-2 leading-tight">{language === 'en' ? stat.titleEn : stat.titleNep}</span>
          <div className="relative inline-block cursor-help shrink-0">
            <Info size={10} className={`${isSummary ? 'text-white/30' : 'text-slate-300 dark:text-slate-600'} hover:text-indigo-400 transition-colors`} />
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 dark:bg-slate-800 text-white text-[0.5625rem] rounded-lg shadow-xl pointer-events-none z-50 whitespace-normal text-center font-normal leading-relaxed">
              {(stat as any).description || (
                stat.id === 'Weighting' ? (language === 'en' ? 'Sum of all individual indicator weights across the system.' : 'प्रणालीका सबै व्यक्तिगत सूचकहरूको भारको कुल योगफल।') :
                stat.id === 'SystemPerformance' ? (language === 'en' ? 'Calculated as the weighted average across all active indicators.' : 'सबै सक्रिय सूचकहरूमा भारित औसतको रूपमा गणना गरिएको।') :
                (language === 'en' ? 'Detailed performance tracking for this indicator.' : 'यस सूचकको लागि विस्तृत कार्यसम्पादन अनुगमन।')
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
            </div>
          </div>
        </h3>
        
        {(stat as any).unit && (
          <div className={`text-[0.5rem] font-black uppercase tracking-tighter mb-1.5 ${isSummary ? 'text-white/40' : 'text-slate-400'}`}>
            {language === 'en' ? 'Unit' : 'एकाई'}: {translateUnit((stat as any).unit)}
          </div>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            <span className={`text-lg sm:text-xl font-black ${isSummary ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {typeof stat.achieved === 'number' ? (
                <AnimatedNumber value={stat.achieved} isNepali={language === 'np'} />
              ) : (
                stat.achieved ?? ''
              )}
              {stat.total !== undefined && stat.total !== null && (
                <span className={`text-[0.625rem] font-bold mx-0.5 ${isSummary ? 'text-white/30' : 'text-slate-400'}`}>
                  / {typeof stat.total === 'number' ? (
                    <AnimatedNumber value={stat.total} isNepali={language === 'np'} />
                  ) : (
                    stat.total
                  )}
                </span>
              )}
            </span>
            {stat.extra && (
              <span className={`text-[0.5rem] font-bold uppercase tracking-tighter ${isSummary ? 'text-white/40' : 'text-slate-400'}`}>
                {stat.extra}
              </span>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {stat.percentage !== null && stat.percentage !== undefined && (
              <div className={`text-lg sm:text-xl font-black ${
                isSummary ? 'text-indigo-400' :
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'indigo' ? 'text-indigo-600' :
                stat.color === 'emerald' ? 'text-emerald-600' :
                stat.color === 'purple' ? 'text-purple-600' :
                stat.color === 'amber' ? 'text-amber-600' :
                'text-slate-600'
              }`}>
                {typeof stat.percentage === 'number' ? (
                  <AnimatedNumber value={stat.percentage} isNepali={language === 'np'} suffix="%" />
                ) : (
                  `${stat.percentage}%`
                )}
              </div>
            )}

            {(stat as any).history && (
              <div className={`p-1 rounded-lg border ${isSummary ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                <Sparkline 
                  data={(stat as any).history} 
                  color={
                    isSummary ? '#818cf8' :
                    stat.color === 'blue' ? '#2563eb' :
                    stat.color === 'indigo' ? '#4f46e5' :
                    stat.color === 'emerald' ? '#10b981' :
                    stat.color === 'purple' ? '#9333ea' :
                    stat.color === 'amber' ? '#d97706' :
                    '#94a3b8'
                  }
                  unit={(stat as any).unit}
                  isPercentage={stat.percentage !== null && stat.percentage !== undefined}
                  language={language}
                  translateUnit={translateUnit}
                  delay={delay}
                />
              </div>
            )}
          </div>
        </div>

        {/* HISTORICAL MILESTONES */}
        {(stat as any).history && (
          <div className={`mt-3 pt-2 border-t ${isSummary ? 'border-white/5' : 'border-slate-100 dark:border-white/5'}`}>
            <span className={`text-[0.4375rem] sm:text-[0.5rem] block font-sans uppercase tracking-widest mb-1.5 ${isSummary ? 'opacity-40' : 'text-slate-400'}`}>
              {language === 'en' ? 'Milestones' : 'माइलस्टोनहरू'}
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(stat as any).history.map((milestone: any, idx: number) => (
                <div key={idx} className={`flex flex-col px-1.5 py-0.5 rounded-md border ${
                  isSummary 
                    ? 'bg-white/5 border-white/5' 
                    : 'bg-slate-100/50 dark:bg-white/5 border-slate-100 dark:border-white/5'
                } min-w-[38px] sm:min-w-[45px]`}>
                  <span className={`text-[0.375rem] sm:text-[0.4375rem] leading-none ${isSummary ? 'opacity-30' : 'text-slate-400'}`}>
                    {milestone.date.split('/').slice(-2).join('/')}
                  </span>
                  <span className={`text-[0.5625rem] sm:text-[0.625rem] font-black mt-0.5 ${isSummary ? 'text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {milestone.value}{milestone.isPercentage ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Distribution levels for summary cards if provided */}
        {isSummary && (stat as any).distribution && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                {language === 'en' ? 'Indicator Status Spread' : 'सूचक स्थिति वितरण'}
              </span>
              <span className="text-[10px] font-black text-indigo-400">5 {language === 'en' ? 'Levels' : 'स्तरहरू'}</span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5">
              {(() => {
                const distribution = (stat as any).distribution;
                const total = distribution.reduce((acc: number, d: any) => acc + d.count, 0) || 1;
                return distribution.map((d: any, i: number) => {
                  const width = (d.count / total) * 100;
                  return (
                    <motion.div 
                      key={i} 
                      className="h-full relative group/dist" 
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ type: "spring", stiffness: 60, damping: 12, delay: i * 0.05 }}
                      style={{ backgroundColor: d.color }}
                    >
                      <div className="absolute opacity-0 group-hover/dist:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded border border-white/10 whitespace-nowrap z-50">
                        {language === 'en' ? d.labelEn : d.labelNp}: {d.count} ({Math.round(width)}%)
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between mt-1.5 px-0.5">
              {(stat as any).distribution.map((d: any, i: number) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-black text-white/50">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isSummary && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
      )}

      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${isSummary ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800/50'} overflow-hidden`}>
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(stat.percentage !== null && stat.percentage !== undefined ? stat.percentage : 100, 100)}%` }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 + delay }}
          className={`h-full relative overflow-hidden ${
            isSummary ? 'bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.4)]' :
            stat.color === 'blue' ? 'bg-indigo-500/90 dark:bg-indigo-400' :
            stat.color === 'indigo' ? 'bg-indigo-500/90 dark:bg-indigo-400' :
            stat.color === 'emerald' ? 'bg-emerald-500/90 dark:bg-emerald-400' :
            stat.color === 'purple' ? 'bg-purple-500/90 dark:bg-purple-400' :
            stat.color === 'amber' ? 'bg-amber-500/90 dark:bg-amber-400' :
            'bg-slate-400/90'
          }`}
        >
          {/* Shimmer effect for the "fill" animation */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 1 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  indicators, 
  metadata, 
  activeMetric, 
  updatesHistory, 
  onOpenAbout,
  onOpenDataHealth,
  setViewMode,
  setCategoryFilter,
  addToast
}) => {
  const { language, translateUnit } = useLanguage();
  const { isAdmin } = useAuth();
  const [mainVisualMode, setMainVisualMode] = React.useState<'trajectory' | 'sector' | 'progress' | 'radial' | 'category' | 'indicator'>('trajectory');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isListeningVoice, setIsListeningVoice] = React.useState(false);
  const [voiceFeedback, setVoiceFeedback] = React.useState<string | null>(null);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = React.useState(false);
  const [voiceSuccessTrigger, setVoiceSuccessTrigger] = React.useState(false);
  const viewDropdownRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculations based on actual data
  const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
  
  // Calculate actual completed weight progress dynamically
  const achievedWeight = indicators.reduce((acc, curr) => {
    if (!curr) return acc;
    const target = curr.annualTarget || 0;
    const progress = curr.annualProgress || 0;
    const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
    return acc + (achievement * ((curr.weight || 0) / 100));
  }, 0);
  
  const weightPercentage = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

  // Weighted Achievement Rate (Average)
  const weightedAchievementRate = (indicators.length > 0 && totalWeight > 0)
    ? Math.round(
        indicators.reduce((acc, curr) => {
          if (!curr) return acc;
          const target = curr.annualTarget || 0;
          const progress = curr.annualProgress || 0;
          const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
          return acc + (achievement * (curr.weight || 0));
        }, 0) / totalWeight
      )
    : 0;

  const aggregatedProgressData = React.useMemo(() => {
    const ranges = [
      { labelEn: 'Critical (0-20%)', labelNp: 'गम्भीर (०-२०%)', min: 0, max: 20, color: '#ef4444' },
      { labelEn: 'At Risk (20-40%)', labelNp: 'जोखिममा (२०-४०%)', min: 20, max: 40, color: '#f59e0b' },
      { labelEn: 'Progressing (40-60%)', labelNp: 'प्रगतिमा (४०-६०%)', min: 40, max: 60, color: '#6366f1' },
      { labelEn: 'On Track (60-80%)', labelNp: 'सञ्चालनमा (६०-८०%)', min: 60, max: 80, color: '#3b82f6' },
      { labelEn: 'Excellent (80-100%)', labelNp: 'उत्कृष्ट (८०-१००%)', min: 80, max: 101, color: '#10b981' },
    ];
    return ranges.map(range => {
      const count = (indicators || []).filter(ind => {
        if (!ind) return false;
        const target = ind.annualTarget || 0;
        const progress = ind.annualProgress || 0;
        const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return achievement >= range.min && achievement < range.max;
      }).length;
      return { ...range, count };
    });
  }, [indicators]);

  const totalEngagedOfficesCount = DOR_OFFICES_LIST.length;

  const summaryStats = [
    {
      id: 'SystemPerformance',
      titleNep: 'समग्र कार्यसम्पादन',
      titleEn: 'Overall Performance',
      icon: <Target size={20} />,
      color: 'emerald',
      achieved: weightedAchievementRate,
      percentage: weightedAchievementRate,
      extra: language === 'en' ? 'Avg Achievement' : 'औसत उपलब्धि',
      history: [
        { value: 0, date: '2082/04/01', isPercentage: true },
        ...HISTORICAL_DATA.map(h => ({ value: h.metadata.totalWeightProgress - 5, date: h.lastUpdateDate, isPercentage: true })),
        { value: weightedAchievementRate, date: metadata?.lastUpdateDate || '2083/02/15', isPercentage: true }
      ].slice(-5),
      description: language === 'en'
        ? 'Calculated as the weighted average across all active indicators.'
        : 'सबै सक्रिय सूचकहरूमा भारित औसतको रूपमा गणना गरिएको।',
      tab: 'logic',
      distribution: aggregatedProgressData
    },
    {
      id: 'EngagedOffices',
      titleNep: 'सम्बद्ध सडक कार्यालयहरू',
      titleEn: 'Engaged DoR Offices/Units',
      icon: <Building2 size={20} />,
      color: 'indigo',
      achieved: totalEngagedOfficesCount,
      total: null,
      percentage: null,
      extra: language === 'en' ? 'Active Reporting Units' : 'सक्रिय रिपोर्टिङ एकाइहरू',
      history: [
        { value: 105, date: '2082/04/01', isPercentage: false },
        { value: 108, date: '2082/08/15', isPercentage: false },
        { value: 110, date: HISTORICAL_DATA[0]?.lastUpdateDate || '2082/11/26', isPercentage: false },
        { value: 111, date: HISTORICAL_DATA[1]?.lastUpdateDate || '2082/12/30', isPercentage: false },
        { value: totalEngagedOfficesCount, date: metadata?.lastUpdateDate || '2083/02/15', isPercentage: false }
      ].slice(-5),
      description: language === 'en' 
        ? 'Number of concerned Division Offices and specialized DoR branches actively reporting.' 
        : 'सक्रिय रूपमा रिपोर्टिङ गर्ने सम्बद्ध डिभिजन सडक कार्यालयहरू र विशिष्ट शाखाहरूको संख्या।',
      tab: 'offices'
    },
    ...(isAdmin ? [{
      id: 'DataHealth',
      titleNep: 'डेटा स्वास्थ्य स्थिति',
      titleEn: 'Data Health Integrity',
      icon: <Shield size={20} />,
      color: 'amber',
      achieved: (indicators || []).filter(ind => {
        if (!ind) return false;
        const lastUpdated = ind.updatedAt ? new Date(ind.updatedAt) : null;
        const now = new Date();
        const isStale = lastUpdated ? (now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24) > 30 : true;
        return !isStale;
      }).length,
      total: indicators.length,
      percentage: Math.round(((indicators || []).filter(ind => {
        if (!ind) return false;
        const lastUpdated = ind.updatedAt ? new Date(ind.updatedAt) : null;
        const now = new Date();
        const isStale = lastUpdated ? (now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24) > 30 : true;
        return !isStale;
      }).length / (indicators.length || 1)) * 100),
      extra: language === 'en' ? 'Healthy Indicators' : 'स्वस्थ सूचकहरू',
      history: [
        { value: 85, date: '2082/04/01', isPercentage: true },
        { value: 88, date: '2082/08/15', isPercentage: true },
        { value: 92, date: '2082/11/26', isPercentage: true },
        { value: 90, date: '2082/12/30', isPercentage: true },
        { value: Math.round(((indicators || []).filter(ind => {
          if (!ind) return false;
          const lastUpdated = ind.updatedAt ? new Date(ind.updatedAt) : null;
          const now = new Date();
          const isStale = lastUpdated ? (now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24) > 30 : true;
          return !isStale;
        }).length / (indicators.length || 1)) * 100), date: '2083/02/15', isPercentage: true }
      ].slice(-5),
      description: language === 'en' 
        ? 'Percentage of indicators with recent updates (within 30 days) and complete history.'
        : 'भर्खरैका अद्यावधिकहरू (३० दिनभित्र) र पूर्ण इतिहास भएका सूचकहरूको प्रतिशत।',
      tab: 'health'
    }] : [
      {
        id: 'IndicatorsTracked',
        titleNep: 'ट्र्याक गरिएका सूचकहरू',
        titleEn: 'Indicators Tracked',
        icon: <LayoutGrid size={20} />,
        color: 'blue',
        achieved: indicators.length,
        total: null,
        percentage: null,
        extra: language === 'en' ? 'Core performance metrics' : 'मुख्य कार्यसम्पादन मापनहरू',
        history: [
          { value: 45, date: '2082/04/01', isPercentage: false },
          { value: 48, date: '2082/08/15', isPercentage: false },
          { value: 50, date: HISTORICAL_DATA[0]?.lastUpdateDate || '2082/11/26', isPercentage: false },
          { value: 52, date: HISTORICAL_DATA[1]?.lastUpdateDate || '2082/12/30', isPercentage: false },
          { value: indicators.length, date: metadata?.lastUpdateDate || '2083/02/15', isPercentage: false }
        ].slice(-5),
        description: language === 'en' 
          ? 'Total number of key performance indicators (KPIs) monitored across all categories.'
          : 'सबै वर्गहरूमा अनुगमन गरिएका मुख्य कार्यसम्पादन सूचकहरूको कुल संख्या।',
        tab: 'indicators'
      }
    ])
  ];

  const indicatorsByOffice = indicators.reduce((acc, ind) => {
    if (ind.office) {
      acc[ind.office] = (acc[ind.office] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleStatClick = (tab: string) => {
    if (tab === 'health' && onOpenDataHealth) {
      triggerHaptic('medium');
      onOpenDataHealth();
      return;
    }
    if (onOpenAbout) {
      triggerHaptic('medium');
      onOpenAbout(tab);
    }
  };

  const mainChartData = [
    { date: '2082/04/01', progress: 5, labelEn: 'Fiscal Year Commencement', labelNp: 'आर्थिक वर्ष प्रारम्भ' },
    { date: '2082/11/26', progress: 15, labelEn: 'First Quarter Review', labelNp: 'पहिलो त्रैमासिक समीक्षा' },
    { date: '2082/12/30', progress: 51, labelEn: 'Mid-Term Evaluation', labelNp: 'मध्यावधि मूल्याङ्कन' },
    { date: metadata?.lastUpdateDate || '2083/02/15', progress: weightedAchievementRate, labelEn: 'Current Performance', labelNp: 'हालको कार्यसम्पादन' }
  ];

  const sectorPerformanceData = React.useMemo(() => {
    const categories = Array.from(new Set(indicators.map(ind => ind.category)));
    return categories.map(cat => {
      const catInds = indicators.filter(ind => ind.category === cat);
      const catTotalWeight = catInds.reduce((acc, ind) => acc + (ind.weight || 0), 0);
      const catWeightedAchievement = catInds.reduce((acc, ind) => {
        const target = ind.annualTarget || 0;
        const progress = ind.annualProgress || 0;
        const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return acc + (achievement * (ind.weight || 0));
      }, 0);
      return {
        category: cat,
        achievement: catTotalWeight > 0 ? Math.round(catWeightedAchievement / catTotalWeight) : 0,
        count: catInds.length
      };
    }).sort((a, b) => b.achievement - a.achievement);
  }, [indicators]);

  const speakDashboardSummary = () => {
    triggerHaptic('medium');
    
    if (getMuted()) return;

    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const total = indicators.length;
    const lowIndicators = indicators.filter(ind => {
      const target = ind.annualTarget || 0;
      const progress = ind.annualProgress || 0;
      const achievement = target > 0 ? (progress / target) * 100 : 0;
      return achievement < 20;
    });

    let text = '';
    if (language === 'en') {
      text = `System Dashboard Summary. Tracking ${total} performance indicators. The overall weighted achievement rate is ${weightedAchievementRate} percent. `;
      if (lowIndicators.length > 0) {
        text += `Attention required: There are ${lowIndicators.length} indicators performing below the 20 percent threshold. `;
        const listNames = lowIndicators.slice(0, 5).map(i => i.nameEn || i.name).join(', ');
        text += `These critical indicators include: ${listNames}. `;
        if (lowIndicators.length > 5) {
          text += `and ${lowIndicators.length - 5} other indicators. `;
        }
        text += "Please review these indicators for recovery actions.";
      } else {
        text += "Outstanding performance. All active indicators are currently performing above the 20 percent threshold.";
      }
    } else {
      const nepaliTotal = toNepaliNumerals(total);
      const nepaliRate = toNepaliNumerals(weightedAchievementRate);
      const nepaliLowCount = toNepaliNumerals(lowIndicators.length);

      text = `प्रणाली ड्यासबोर्ड सारांश। कुल ${nepaliTotal} कार्यसम्पादन सूचकहरू ट्र्याक गरिएको छ। समग्र भारित उपलब्धि दर ${nepaliRate} प्रतिशत रहेको छ। `;
      if (lowIndicators.length > 0) {
        text += `विशेष ध्यान दिनुहोस्: ${nepaliLowCount} वटा सूचकहरू बीस प्रतिशतको थ्रेसहोल्ड भन्दा कम प्रदर्शनमा छन्। `;
        const listNames = lowIndicators.slice(0, 5).map(i => i.name).join(', ');
        text += `यी सूचकहरूमा: ${listNames} समावेश छन्। `;
        if (lowIndicators.length > 5) {
          text += `र अन्य ${toNepaliNumerals(lowIndicators.length - 5)} सूचकहरू। `;
        }
        text += "कृपया यी सूचकहरूको सुधारका लागि आवश्यक कदमहरू चाल्नुहोला।";
      } else {
        text += "उत्कृष्ट कार्यसम्पादन। सबै सूचकहरू हाल बीस प्रतिशतको न्यूनतम थ्रेसहोल्ड भन्दा माथि रहेका छन्।";
      }
    }

    speak(text, language === 'np' ? 'ne' : 'en');
  };

  const speakFeedback = (textToSpeak: string) => {
    speak(textToSpeak, language === 'np' ? 'ne' : 'en');
  };

  const processVoiceCommand = (text: string) => {
    const normalized = text.toLowerCase().trim();
    const isEn = language === 'en';

    // View detection
    let matchedView: ViewMode | null = null;
    let viewFeedbackEn = '';
    let viewFeedbackNp = '';

    if (
      normalized.includes('table view') ||
      normalized.includes('show table') ||
      normalized.includes('go to table') ||
      normalized.includes('table mode') ||
      normalized.includes('टेबल') ||
      normalized.includes('तालिका')
    ) {
      matchedView = 'table';
      viewFeedbackEn = 'Switching to Table View.';
      viewFeedbackNp = 'तालिका दृश्यमा जाँदैछ।';
    } else if (
      normalized.includes('card view') ||
      normalized.includes('show card') ||
      normalized.includes('go to card') ||
      normalized.includes('card mode') ||
      normalized.includes('कार्ड')
    ) {
      matchedView = 'card';
      viewFeedbackEn = 'Switching to Card View.';
      viewFeedbackNp = 'कार्ड दृश्यमा जाँदैछ।';
    } else if (
      normalized.includes('chart view') ||
      normalized.includes('show chart') ||
      normalized.includes('go to chart') ||
      normalized.includes('chart mode') ||
      normalized.includes('चार्ट')
    ) {
      matchedView = 'chart';
      viewFeedbackEn = 'Switching to Chart View.';
      viewFeedbackNp = 'चार्ट दृश्यमा जाँदैछ।';
    } else if (
      normalized.includes('heatmap view') ||
      normalized.includes('show heatmap') ||
      normalized.includes('go to heatmap') ||
      normalized.includes('heat map') ||
      normalized.includes('heatmap mode') ||
      normalized.includes('हिटम्याप') ||
      normalized.includes('हिट म्याप')
    ) {
      matchedView = 'heatmap';
      viewFeedbackEn = 'Switching to Heatmap View.';
      viewFeedbackNp = 'हिटम्याप दृश्यमा जाँदैछ।';
    } else if (
      normalized.includes('dashboard view') ||
      normalized.includes('show dashboard') ||
      normalized.includes('go to dashboard') ||
      normalized.includes('dashboard mode') ||
      normalized.includes('ड्यासबोर्ड')
    ) {
      matchedView = 'dashboard';
      viewFeedbackEn = 'Switching to Dashboard View.';
      viewFeedbackNp = 'ड्यासबोर्ड दृश्यमा जाँदैछ।';
    } else if (
      normalized.includes('institutional view') ||
      normalized.includes('show institutional') ||
      normalized.includes('go to institutional') ||
      normalized.includes('institutional mode') ||
      normalized.includes('organization') ||
      normalized.includes('highlights') ||
      normalized.includes('संस्थागत') ||
      normalized.includes('कार्यालय')
    ) {
      matchedView = 'institutional';
      viewFeedbackEn = 'Switching to Institutional Highlights View.';
      viewFeedbackNp = 'संस्थागत मुख्य अंश दृश्यमा जाँदैछ।';
    }

    if (matchedView && setViewMode) {
      setViewMode(matchedView);
      const confirmationMsg = isEn ? viewFeedbackEn : viewFeedbackNp;
      setVoiceFeedback(confirmationMsg);
      speakFeedback(confirmationMsg);
      triggerHaptic('success');
      addToast?.({ id: Date.now().toString(), message: confirmationMsg, type: 'success' });
      setVoiceSuccessTrigger(true);
      setTimeout(() => setVoiceSuccessTrigger(false), 1500);
      return;
    }

    // Category filter detection
    let matchedCategory: string | null = null;
    let catFeedbackEn = '';
    let catFeedbackNp = '';

    if (
      normalized.includes('infrastructure') ||
      normalized.includes('creation') ||
      normalized.includes('पूर्वाधार') ||
      normalized.includes('भौतिक पूर्वाधार') ||
      normalized.includes('भौतिक')
    ) {
      matchedCategory = 'Infrastructure Creation';
      catFeedbackEn = 'Filtering indicators by Infrastructure Creation category.';
      catFeedbackNp = 'भौतिक पूर्वाधार श्रेणी अनुसार फिल्टर गर्दैछ।';
    } else if (
      normalized.includes('maintenance') ||
      normalized.includes('मर्मत') ||
      normalized.includes('मर्मतसम्भार') ||
      normalized.includes('सडक')
    ) {
      matchedCategory = 'Maintenance';
      catFeedbackEn = 'Filtering indicators by Road Maintenance category.';
      catFeedbackNp = 'मर्मतसम्भार श्रेणी अनुसार फिल्टर गर्दैछ।';
    } else if (
      normalized.includes('employment') ||
      normalized.includes('job') ||
      normalized.includes('रोजगार') ||
      normalized.includes('रोजगारी')
    ) {
      matchedCategory = 'Employment Creation';
      catFeedbackEn = 'Filtering indicators by Employment Creation category.';
      catFeedbackNp = 'रोजगारी सिर्जना श्रेणी अनुसार फिल्टर गर्दैछ।';
    } else if (
      normalized.includes('budget') ||
      normalized.includes('बजेट') ||
      normalized.includes('वित्तीय')
    ) {
      matchedCategory = 'Budget Utilization';
      catFeedbackEn = 'Filtering indicators by Budget Utilization category.';
      catFeedbackNp = 'बजेट उपयोगिता श्रेणी अनुसार फिल्टर गर्दैछ।';
    } else if (
      normalized.includes('governance') ||
      normalized.includes('auditing') ||
      normalized.includes('सुशासन') ||
      normalized.includes('संस्थागत सबलीकरण')
    ) {
      matchedCategory = 'Governance';
      catFeedbackEn = 'Filtering indicators by Governance and Auditing category.';
      catFeedbackNp = 'सुशासन श्रेणी अनुसार फिल्टर गर्दैछ।';
    } else if (
      normalized === 'all' ||
      normalized.includes('show all') ||
      normalized.includes('clear filter') ||
      normalized === 'सबै' ||
      normalized.includes('सबै सूचक')
    ) {
      matchedCategory = 'All';
      catFeedbackEn = 'Showing all performance indicators.';
      catFeedbackNp = 'सबै श्रेणीका सूचकहरू देखाउँदैछ।';
    }

    if (matchedCategory !== null && setCategoryFilter) {
      setCategoryFilter(matchedCategory);
      const confirmationMsg = isEn ? catFeedbackEn : catFeedbackNp;
      setVoiceFeedback(confirmationMsg);
      speakFeedback(confirmationMsg);
      triggerHaptic('success');
      setVoiceSuccessTrigger(true);
      setTimeout(() => setVoiceSuccessTrigger(false), 1500);
      return;
    }

    // Fallback if no command was matched
    const unknownMsg = isEn
      ? `Voice command not recognized: "${text}". Try saying "Navigate to Table View" or "Show Budget Indicators".`
      : `आवाज आदेश चिनिएन: "${text}"। कृपया "तालिका दृश्यमा जानुहोस्" वा "बजेट सूचकहरू देखाउनुहोस्" भन्नुहोला।`;
    setVoiceError(unknownMsg);
    speakFeedback(unknownMsg);
  };

  const toggleVoiceListening = () => {
    triggerHaptic('medium');
    setVoiceError(null);
    setVoiceFeedback(null);

    if (isListeningVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = language === 'en' 
        ? 'Speech recognition is not supported in this browser.' 
        : 'तपाईँको ब्राउजरमा आवाज पहिचान सेवा उपलब्ध छैन।';
      setVoiceError(msg);
      speakFeedback(msg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'np' ? 'ne-NP' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningVoice(true);
      setVoiceError(null);
      const startMsg = language === 'en' 
        ? "Voice control active. Say a command like 'Navigate to Table View'." 
        : "आवाज नियन्त्रण सक्रिय भयो। जस्तै: 'तालिका दृश्यमा जानुहोस्' भन्नुहोस्।";
      setVoiceFeedback(startMsg);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results?.[0]?.[0]?.transcript || '';
      transcript = transcript.replace(/[.,?!]+$/, '').trim();
      setVoiceFeedback(language === 'en' ? `Heard: "${transcript}"` : `सुनियो: "${transcript}"`);
      processVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Voice commands error:', event.error);
      setIsListeningVoice(false);
      
      if (event.error === 'not-allowed') {
        setVoiceError(
          language === 'en'
            ? 'Microphone access denied. Please enable mic permissions.'
            : 'माइक पहुँच अस्वीकार गरियो। कृपया सेटिङमा अनुमति दिनुहोस्।'
        );
      } else if (event.error === 'no-speech') {
        setVoiceError(
          language === 'en'
            ? 'No speech detected. Please try again.'
            : 'कुनै आवाज सुनिएन। कृपया फेरि प्रयास गर्नुहोला।'
        );
      } else {
        setVoiceError(
          language === 'en'
            ? `Speech recognition failed: ${event.error}`
            : `आवाज पहिचान असफल भयो: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListeningVoice(false);
      setVoiceError(
        language === 'en'
          ? 'Failed to access microphone.'
          : 'माइक पहुँच गर्न असफल भयो।'
      );
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <AnimatePresence>
        {voiceSuccessTrigger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[9999] ring-[12px] sm:ring-[24px] ring-emerald-500/20 dark:ring-emerald-500/15"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Top Header Section: Compact Summary */}
      <section className="relative bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl p-5 sm:p-8 overflow-hidden shadow-sm border border-indigo-150 dark:border-indigo-950/60 transition-all">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black text-indigo-600 dark:text-indigo-200 uppercase tracking-widest shadow-sm">
                  <Activity size={10} className="animate-pulse" />
                  {language === 'en' ? 'Live System Performance' : 'वास्तविक प्रणाली कार्यसम्पादन'}
                </div>
                <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-400/20 rounded-full text-[10px] font-black text-indigo-600 dark:white uppercase tracking-widest leading-none">
                  {indicators.length} {language === 'en' ? 'Active KPIs' : 'सक्रिय सूचकहरू'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                  {language === 'en' ? 'System Dashboard' : 'प्रणाली ड्यासबोर्ड'}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={speakDashboardSummary}
                    className={`px-4 py-2 rounded-2xl border transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm ${
                      isSpeaking 
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-pulse' 
                        : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                    }`}
                    title={language === 'en' ? 'Listen to summary' : 'सारांश सुन्नुहोस्'}
                  >
                    <Volume2 size={16} className={isSpeaking ? 'animate-bounce' : 'animate-pulse'} />
                    <span>
                      {isSpeaking 
                        ? (language === 'en' ? 'Stop Listening' : 'सुन्न रोक्नुहोस्') 
                        : (language === 'en' ? 'Listen to Summary' : 'सारांश सुन्नुहोस्')
                      }
                    </span>
                  </button>

                  <button 
                    onClick={toggleVoiceListening}
                    className={`px-4 py-2 rounded-2xl border transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm relative overflow-hidden ${
                      voiceSuccessTrigger
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : isListeningVoice 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse' 
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                    title={language === 'en' ? 'Voice control' : 'आवाज नियन्त्रण'}
                  >
                    {voiceSuccessTrigger ? (
                      <CheckCircle2 size={16} className="text-emerald-500 animate-bounce" />
                    ) : isListeningVoice ? (
                      <Mic size={16} className="animate-bounce text-emerald-500" />
                    ) : (
                      <MicOff size={16} />
                    )}
                    <span>
                      {voiceSuccessTrigger
                        ? (language === 'en' ? 'Success!' : 'सफल भयो!')
                        : isListeningVoice 
                          ? (language === 'en' ? 'Listening...' : 'सुन्दैछ...') 
                          : (language === 'en' ? 'Voice Control' : 'आवाज नियन्त्रण')
                      }
                    </span>
                    {(voiceSuccessTrigger || isListeningVoice) && (
                      <span className="absolute -inset-[1px] rounded-2xl border-2 border-emerald-500/30 animate-ping pointer-events-none" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsVoiceHelpOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all duration-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm"
                    title={language === 'en' ? 'Voice commands help' : 'आवाज आदेश मद्दत'}
                  >
                    <Info size={14} />
                    <span>
                      {language === 'en' ? 'Commands' : 'आदेशहरू'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-indigo-300/70 text-[11px] font-black uppercase tracking-[0.15em] pl-1">
                <div className="w-10 h-[2px] bg-indigo-500 dark:bg-indigo-400/50" />
                <span>{language === 'en' ? 'Updated' : 'अद्यावधिक'}: {metadata?.lastUpdateDate || '2083/02/15'}</span>
              </div>

              <AnimatePresence>
                {(voiceFeedback || voiceError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-wider border shadow-sm max-w-xl transition-colors duration-300 ${
                      voiceError 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400' 
                        : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${voiceError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <span>{voiceFeedback || voiceError}</span>
                    <button 
                      onClick={() => { setVoiceFeedback(null); setVoiceError(null); }}
                      className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 text-slate-500 dark:text-indigo-200/60 text-[10px] font-black uppercase tracking-widest bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 w-fit">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-slate-600 dark:text-indigo-100">{language === 'en' ? 'Operational' : 'सञ्चालनमा'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode && setViewMode("card")}
              className="group relative flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-indigo-900 rounded-[24px] font-black text-[13px] uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-slate-900/10 dark:shadow-indigo-500/20 transform hover:-translate-y-1 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-indigo-50 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">
                {language === "en" ? "Detailed Gallery" : "विस्तृत ग्यालरी"}
              </span>
              <div className="relative z-10 w-8 h-8 rounded-full bg-white/10 dark:bg-indigo-100 text-white dark:text-indigo-700 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-indigo-600 group-hover:text-slate-900 dark:group-hover:text-white transition-all duration-300">
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* PERFORMANCE METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12">
        {summaryStats.map((stat, idx) => (
          <motion.div 
            layout
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard 
              stat={stat} 
              activeMetric={activeMetric} 
              language={language} 
              translateUnit={translateUnit} 
              variant="summary"
              onClick={() => handleStatClick(stat.tab)}
              className={idx === 1 ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 bg-indigo-50/30 dark:bg-indigo-500/5' : ''}
            />
          </motion.div>
        ))}
      </div>

      {/* PRIORITIZED OVERALL PERFORMANCE GRAPH */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        
        {/* Unified Master Header & Tab Controller */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10 border-b border-slate-100 dark:border-white/5 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
              {mainVisualMode === 'trajectory' 
                ? (language === 'en' ? 'Overall Trends' : 'समग्र प्रवृतिहरू')
                : mainVisualMode === 'sector'
                  ? (language === 'en' ? 'Sector Performance' : 'क्षेत्रीय कार्यसम्पादन')
                  : mainVisualMode === 'progress'
                    ? (language === 'en' ? 'Aggregated Progress' : 'एकीकृत प्रगति')
                    : mainVisualMode === 'radial'
                      ? (language === 'en' ? 'Overall Performance Circular' : 'समग्र कार्यसम्पादन चक्र')
                      : (language === 'en' ? 'Detailed Indicator KPI Metrics' : 'विस्तृत सूचक मापनहरू')}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 flex items-center gap-2">
              <Activity size={18} className="text-indigo-500 animate-pulse" />
              {mainVisualMode === 'trajectory' 
                ? (language === 'en' ? 'Performance Trajectory' : 'कार्यसम्पादन मार्गचित्र')
                : mainVisualMode === 'sector'
                  ? (language === 'en' ? 'Sectoral Breakdown' : 'क्षेत्रीय विश्लेषण')
                  : mainVisualMode === 'progress'
                    ? (language === 'en' ? 'Progress Distribution' : 'प्रगति वितरण')
                    : mainVisualMode === 'radial'
                      ? (language === 'en' ? 'Radial Breakdown' : 'रेडियल विश्लेषण')
                      : (language === 'en' ? 'KPI Detailed Chart' : 'सूचक विस्तृत चार्ट')}
            </h3>
          </div>
          
          {/* Master Segment Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
            {[
              { id: 'trajectory', labelEn: 'Trend', labelNp: 'प्रवृत्ति', icon: <TrendingUp size={14} />, descEn: 'Historical Growth', descNp: 'ऐतिहासिक वृद्धि' },
              { id: 'radial', labelEn: 'Overall Circular', labelNp: 'समग्र चक्र', icon: <Activity size={14} />, descEn: 'Radial Progress', descNp: 'रेडियल प्रगति' },
              { id: 'indicator', labelEn: 'Detailed KPI', labelNp: 'सूचक विवरण', icon: <Target size={14} />, descEn: 'Interactive KPIs', descNp: 'अन्तर्क्रियात्मक KPI' },
              { id: 'sector', labelEn: 'Sectors', labelNp: 'क्षेत्रहरू', icon: <LayoutGrid size={14} />, descEn: 'Simple sector bar', descNp: 'साधारण क्षेत्र' },
              { id: 'progress', labelEn: 'Spread', labelNp: 'वितरण', icon: <Info size={14} />, descEn: 'Range Distribution', descNp: 'प्रगति वितरण' }
            ].map((tab) => {
              const isSelected = mainVisualMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setMainVisualMode(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-md border border-indigo-500'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850/50'
                  }`}
                  title={language === 'en' ? tab.descEn : tab.descNp}
                >
                  {tab.icon}
                  <span>{language === 'en' ? tab.labelEn : tab.labelNp}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Visualization Area (Height adjusts dynamically depending on chart complexity) */}
        <div className={`w-full relative z-10 transition-all duration-500 ease-in-out ${
          ['radial', 'category', 'indicator'].includes(mainVisualMode)
            ? 'h-[500px] sm:h-[600px]'
            : 'h-64 sm:h-80'
        }`}>
          <AnimatePresence mode="wait">
            {mainVisualMode === 'trajectory' && (
              <motion.div 
                key="trajectory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={mainChartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onMouseEnter={() => triggerHaptic('light')}
                  >
                    <defs>
                      <linearGradient id="performanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} className="hidden dark:block" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontWeight={600} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      tickFormatter={(tick) => language === 'np' ? toNepaliNumerals(tick.split('/').slice(-2).join('/')) : tick.split('/').slice(-2).join('/')}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontWeight={600} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 100]}
                      dx={-10}
                      tickFormatter={(tick) => language === 'np' ? `${toNepaliNumerals(tick)}%` : `${tick}%`}
                    />
                    <Tooltip content={<CustomOverallChartTooltip language={language} />} cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                    <Area 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#performanceGrad)" 
                      activeDot={{ r: 6, strokeWidth: 1, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {mainVisualMode === 'radial' && (
              <motion.div 
                key="radial"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full"
              >
                <RadialPerformanceChart 
                  indicators={indicators}
                  metadata={metadata}
                  activeMetric={null}
                  onHover={() => {}}
                  updatesHistory={updatesHistory}
                  isFocusMode={false}
                  isEmbedded={true}
                  viewMode={mainVisualMode}
                />
              </motion.div>
            )}



            {mainVisualMode === 'indicator' && (
              <motion.div 
                key="indicator"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full overflow-y-auto pr-1"
              >
                <div className="p-1">
                  <MetricsChart indicators={indicators} />
                </div>
              </motion.div>
            )}

            {mainVisualMode === 'sector' && (
              <motion.div 
                key="sector"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={sectorPerformanceData} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    onMouseEnter={() => triggerHaptic('light')}
                  >
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      fontWeight={700} 
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-white/10 p-3 rounded-2xl shadow-xl text-white text-[10px]">
                              <div className="font-black mb-1">{data.category}</div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Achievement:</span>
                                <span className="font-black text-indigo-400">{data.achievement}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Indicators:</span>
                                <span className="font-black">{data.count}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="achievement" radius={[0, 10, 10, 0]} barSize={20}>
                      {sectorPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.achievement > 75 ? '#10b981' : entry.achievement > 50 ? '#3b82f6' : entry.achievement > 25 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {mainVisualMode === 'progress' && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full flex flex-col justify-center px-4 sm:px-12"
              >
                <div className="space-y-6">
                  {aggregatedProgressData.map((range, idx) => {
                    const total = indicators.length;
                    const percent = Math.round((range.count / total) * 100);
                    return (
                      <div 
                        key={idx} 
                        className="space-y-2 cursor-pointer group/range"
                        onMouseEnter={() => triggerHaptic('light')}
                        onClick={() => {
                          if (setCategoryFilter && setViewMode) {
                            triggerHaptic('medium');
                            setViewMode('card');
                            // Filtering by range might be complex if not explicitly supported, 
                            // but we can at least provide tactile feedback.
                          }
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">{language === 'en' ? range.labelEn : range.labelNp}</span>
                          <span className="text-slate-900 dark:text-white">{range.count} {language === 'en' ? 'Indicators' : 'सूचकहरू'} ({percent}%)</span>
                        </div>
                        <div className="h-3.5 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "spring", stiffness: 60, damping: 12, delay: idx * 0.05 }}
                            className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: range.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {isAdmin && <DataHealthMonitor indicators={indicators} metadata={metadata} />}

      <VoiceHelpModal 
        isOpen={isVoiceHelpOpen} 
        onClose={() => setIsVoiceHelpOpen(false)} 
        onSelectCommand={(cmd) => {
          setIsVoiceHelpOpen(false);
          processVoiceCommand(cmd);
        }}
      />
    </div>
  );
};

// Helper Icon for Indicator Registry button
const ArrowRight = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
