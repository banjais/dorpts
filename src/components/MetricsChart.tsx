import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Indicator } from '../types';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LabelList,
  ReferenceLine,
  ReferenceDot,
  Scatter
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, Activity, Sparkles, AlertCircle, Rocket, Trophy, Star, Pin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { HISTORICAL_DATA } from '../historicalData';
import { triggerHaptic } from '../utils/haptic';

interface ChartProps {
  indicators: Indicator[];
}

const CustomTooltip = ({ active, payload, t, translateUnit }: { active?: boolean, payload?: any[], t: (key: string) => string, translateUnit: (unit: string) => string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const baselineValue = typeof data.baseline === 'number' ? data.baseline : parseFloat(data.baseline);
    const hasValidBaseline = !isNaN(baselineValue) && baselineValue !== 0;
    const changeFromBaseline = hasValidBaseline 
      ? Math.round(((data.progress - baselineValue) / Math.abs(baselineValue)) * 100)
      : null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 min-w-[240px] backdrop-blur-md">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
          {t('performanceDetail')}
        </p>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 leading-tight">
          {data.fullName}
        </h4>
        
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('annualProgress')}</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {data.progress} <span className="text-[10px] font-normal text-slate-400">{translateUnit(data.unit)}</span>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('annualTarget')}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {data.target} <span className="text-[10px] font-normal text-slate-400">{translateUnit(data.unit)}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('baseline')}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {data.baseline} <span className="text-[10px] font-normal text-slate-400">{translateUnit(data.unit)}</span>
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{t('completion')}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${data.percent}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 12 }}
                  className={`h-full rounded-full ${data.percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                />
              </div>
              <span className={`text-[11px] font-black ${data.percent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {data.percent}%
              </span>
            </div>
          </div>

          {changeFromBaseline !== null && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('vsBaseline')}</span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${changeFromBaseline >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {changeFromBaseline >= 0 ? '+' : ''}{changeFromBaseline}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const MetricsChart: React.FC<ChartProps> = ({ indicators }) => {
  const { language, t, translateUnit } = useLanguage();
  const [isVertical, setIsVertical] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dor_chart_type_pref');
      if (saved === 'bar' || saved === 'line' || saved === 'area') {
        return saved;
      }
    }
    return 'bar';
  });

  useEffect(() => {
    localStorage.setItem('dor_chart_type_pref', chartType);
  }, [chartType]);

  const chartData = useMemo(() => {
    const lastSnapshot = HISTORICAL_DATA[HISTORICAL_DATA.length - 1];
    
    return (indicators || []).filter(Boolean).map(ind => {
      const histInd = (lastSnapshot?.indicators || []).find(h => h && (h.id === ind.id || h.name === ind.name));
      const prevProgress = histInd ? histInd.annualProgress : 0;
      const prevTarget = histInd ? histInd.annualTarget : ind.annualTarget;
      const prevPercent = prevTarget > 0 ? Math.min(100, Math.round((prevProgress / prevTarget) * 100)) : 0;
      
      const currentPercent = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
      const delta = currentPercent - prevPercent;

      let annotation = null;
      if (currentPercent >= 100 && prevPercent < 100) {
        annotation = { type: 'milestone', label: '100%', icon: <Trophy size={10} className="text-amber-500" />, color: '#f59e0b', bg: '#fef3c7' };
      } else if (currentPercent >= 75 && prevPercent < 75) {
        annotation = { type: 'milestone', label: '75%', icon: <Star size={10} className="text-slate-400" />, color: '#94a3b8', bg: '#f1f5f9' };
      } else if (currentPercent >= 50 && prevPercent < 50) {
        annotation = { type: 'milestone', label: '50%', icon: <Pin size={10} className="text-indigo-500" />, color: '#6366f1', bg: '#e0e7ff' };
      } else if (delta >= 15) {
        annotation = { type: 'spike', label: `+${delta}%`, icon: <Rocket size={10} className="text-emerald-500" />, color: '#10b981', bg: '#ecfdf5' };
      } else if (delta < -2) {
        annotation = { type: 'dip', label: `${delta}%`, icon: <AlertCircle size={10} className="text-rose-500" />, color: '#f43f5e', bg: '#fff1f2' };
      }

      return {
        id: ind.id,
        name: (language === 'en' ? ind.nameEn : ind.name).split(' - ')[0].split('(')[0],
        fullName: language === 'en' ? ind.nameEn : ind.name,
        progress: ind.annualProgress,
        target: ind.annualTarget,
        baseline: ind.baseline,
        unit: ind.unit,
        percent: currentPercent,
        prevPercent,
        delta,
        annotation
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [indicators, language]);

  const averagePercent = useMemo(() => {
    return Math.round(chartData.reduce((acc, d) => acc + d.percent, 0) / (chartData.length || 1));
  }, [chartData]);

  const annotationsList = useMemo(() => {
    return chartData.filter(d => d.annotation !== null).map(d => ({
      ...d,
      x: d.name,
      y: d.percent
    }));
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm col-span-12" id="metrics-charts-panel">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">{t('overallPerformance')}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t('overallProgress')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Bar chart"
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Line chart"
            >
              <LineChartIcon size={16} />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'area' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Area chart"
            >
              <Activity size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsVertical(!isVertical)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg h-[32px] flex items-center"
          >
            {isVertical ? t('rotateHorizontal') : t('rotateVertical')}
          </button>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-1.5 rounded-md transition-all h-[32px] w-[32px] flex items-center justify-center ${showAnnotations ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            title={language === 'en' ? 'Toggle annotations' : 'एनोटेसनहरू टगल गर्नुहोस्'}
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      <div className="h-[600px] w-full overflow-y-auto custom-scrollbar">
        <ResponsiveContainer width="100%" height={isVertical ? chartData.length * 50 : 500}>
          {chartType === 'bar' && (
            <BarChart
              data={chartData}
              layout={isVertical ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 30, left: isVertical ? 100 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={isVertical} vertical={!isVertical} />
              {isVertical ? (
                <>
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                </>
              ) : (
                <>
                  <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis type="number" domain={[0, 100]} unit="%" />
                </>
              )}
              <Tooltip content={<CustomTooltip t={t} translateUnit={translateUnit} />} />
              <ReferenceLine 
                {...(isVertical ? { x: averagePercent } : { y: averagePercent })} 
                stroke="#64748b" 
                strokeDasharray="3 3" 
                label={{ value: `Avg: ${averagePercent}%`, fill: '#64748b', fontSize: 10, fontWeight: 700, position: isVertical ? 'insideBottomRight' : 'insideTopRight' }} 
              />
              <Bar 
                dataKey="percent" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                onMouseEnter={() => triggerHaptic('light')}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percent >= 100 ? '#10b981' : '#6366f1'} />
                ))}
                <LabelList dataKey="percent" position={isVertical ? "right" : "top"} formatter={(value: number) => `${value}%`} fontSize={10} />
                {showAnnotations && (
                  <LabelList 
                    dataKey="annotation" 
                    content={(props: any) => {
                      const { x, y, value, width, height } = props;
                      if (!value) return null;
                      
                      // Calculate position based on orientation
                      const labelX = isVertical ? x + width + 35 : x + width / 2;
                      const labelY = isVertical ? y + height / 2 : y - 20;

                      return (
                        <g transform={`translate(${labelX},${labelY})`}>
                          <rect x="-15" y="-10" width="30" height="20" rx="4" fill={value.bg} stroke={value.color} strokeWidth="0.5" />
                          <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={value.color}>
                            {value.label}
                          </text>
                        </g>
                      );
                    }}
                  />
                )}
              </Bar>
            </BarChart>
          )}

          {chartType === 'line' && (
            <LineChart
              data={chartData}
              layout={isVertical ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 30, left: isVertical ? 100 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={isVertical} vertical={!isVertical} />
              {isVertical ? (
                <>
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                </>
              ) : (
                <>
                  <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis type="number" domain={[0, 100]} unit="%" />
                </>
              )}
              <Tooltip content={<CustomTooltip t={t} translateUnit={translateUnit} />} />
              <ReferenceLine 
                {...(isVertical ? { x: averagePercent } : { y: averagePercent })} 
                stroke="#64748b" 
                strokeDasharray="3 3" 
                label={{ value: `Avg: ${averagePercent}%`, fill: '#64748b', fontSize: 10, fontWeight: 700, position: isVertical ? 'insideBottomRight' : 'insideTopRight' }} 
              />
              <Line 
                type="monotone" 
                dataKey="percent" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#6366f1' }} 
                activeDot={{ r: 6, onMouseEnter: () => triggerHaptic('light') }} 
              />
              {showAnnotations && (
                <Scatter 
                  data={annotationsList} 
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload.annotation) return null;
                    const { color, bg, label } = payload.annotation;
                    return (
                      <g transform={`translate(${cx},${cy - 20})`}>
                        <rect x="-15" y="-10" width="30" height="20" rx="4" fill={bg} stroke={color} strokeWidth="0.5" />
                        <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
                          {label}
                        </text>
                        <path d="M-3,10 L3,10 L0,15 Z" fill={bg} stroke={color} strokeWidth="0.5" />
                      </g>
                    );
                  }}
                />
              )}
            </LineChart>
          )}

          {chartType === 'area' && (
            <AreaChart
              data={chartData}
              layout={isVertical ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 30, left: isVertical ? 100 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={isVertical} vertical={!isVertical} />
              {isVertical ? (
                <>
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                </>
              ) : (
                <>
                  <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis type="number" domain={[0, 100]} unit="%" />
                </>
              )}
              <Tooltip content={<CustomTooltip t={t} translateUnit={translateUnit} />} />
              <ReferenceLine 
                {...(isVertical ? { x: averagePercent } : { y: averagePercent })} 
                stroke="#64748b" 
                strokeDasharray="3 3" 
                label={{ value: `Avg: ${averagePercent}%`, fill: '#64748b', fontSize: 10, fontWeight: 700, position: isVertical ? 'insideBottomRight' : 'insideTopRight' }} 
              />
              <Area 
                type="monotone" 
                dataKey="percent" 
                stroke="#6366f1" 
                fill="#818cf8" 
                fillOpacity={0.3} 
                onMouseEnter={() => triggerHaptic('light')}
              />
              {showAnnotations && (
                <Scatter 
                  data={annotationsList} 
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload.annotation) return null;
                    const { color, bg, label } = payload.annotation;
                    return (
                      <g transform={`translate(${cx},${cy - 25})`}>
                        <rect x="-15" y="-10" width="30" height="20" rx="4" fill={bg} stroke={color} strokeWidth="0.5" />
                        <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
                          {label}
                        </text>
                        <circle cx="0" cy="25" r="3" fill={color} />
                      </g>
                    );
                  }}
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {showAnnotations && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-indigo-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              {language === 'en' ? 'Annotation & Insights Guide' : 'एनोटेसन र अन्तर्दृष्टि गाइड'}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Rocket size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {language === 'en' ? 'Performance Spike' : 'कार्यसम्पादन वृद्धि'}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {language === 'en' ? '>15% gain since last record' : 'अन्तिम रेकर्ड पछि >१५% वृद्धि'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Trophy size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {language === 'en' ? '100% Completion' : '१००% सम्पन्न'}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Full target achievement' : 'पूर्ण लक्ष्य हासिल'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Pin size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {language === 'en' ? 'Major Milestone' : 'प्रमुख माइलस्टोन'}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Reached 50% or 75% mark' : '५०% वा ७५% को विन्दु पार'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle size={14} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {language === 'en' ? 'Correction/Dip' : 'गिरावट/सुधार'}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Unexpected progress drop' : 'प्रगतिमा अप्रत्याशित गिरावट'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
