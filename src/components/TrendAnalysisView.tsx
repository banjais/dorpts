import React, { useState, useMemo } from 'react';
import { Indicator } from '../types';
import { HISTORICAL_DATA } from '../historicalData';
import { useLanguage } from '../context/LanguageContext';
import { 
  ComposedChart,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNepaliDate } from '../utils/date';

interface Metadata {
  lastUpdateDate?: string;
}

interface TrendAnalysisViewProps {
  indicators: Indicator[];
  metadata?: Metadata;
  onOpenAbout?: (tab?: string) => void;
}

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(numStr).replace(/[0-9]/g, (match) => nepaliDigits[parseInt(match, 10)]);
};

interface PayloadData {
  epochId: number;
  date: string;
  labelEn: string;
  labelNp: string;
  target: number;
  progress: number;
  completionRate: number;
  seasonalAvg: number;
}

interface CustomTrendTooltipProps {
  active?: boolean;
  payload?: { payload: PayloadData; value?: number }[];
  language: string;
  trendData: PayloadData[];
  activeUnit: string;
}

const CustomTrendTooltip = ({ active, payload, language, trendData, activeUnit }: CustomTrendTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PayloadData;
    
    // Calculate delta metrics from the previous milestone
    const dataIndex = trendData.findIndex((item) => item.epochId === data.epochId);
    const prevData = dataIndex > 0 ? trendData[dataIndex - 1] : null;
    const progressDelta = prevData ? data.progress - prevData.progress : 0;
    const rateDelta = prevData ? data.completionRate - prevData.completionRate : 0;

    return (
      <div className="bg-slate-950/95 dark:bg-slate-950/95 border border-indigo-500/30 p-4 rounded-2xl shadow-2xl text-[11px] text-white backdrop-blur-md z-50 max-w-[280px] space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div>
            <p className="font-extrabold text-indigo-400 text-xs leading-tight">
              {language === 'en' ? data.labelEn : data.labelNp}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
              {language === 'en' ? `Milestone #${data.epochId}` : `माइलस्टोन #${toNepaliNumerals(data.epochId)}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md text-slate-300">
              {language === 'en' ? data.date : toNepaliNumerals(data.date)}
            </span>
          </div>
        </div>

        <div className="space-y-2 font-mono">
          {/* Completion rate bar indicator */}
          <div className="space-y-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{language === 'en' ? 'Completion Rate' : 'उपलब्धि दर'}:</span>
              <span className="font-black text-indigo-300 text-xs">
                {language === 'en' ? `${data.completionRate}%` : `${toNepaliNumerals(data.completionRate)}%`}
              </span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, data.completionRate)}%` }} 
              />
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px]">
              <span className="text-slate-400 font-semibold">{language === 'en' ? 'Actual Progress' : 'वास्तविक प्रगति'}:</span>
              <span className="font-bold text-emerald-400">
                {language === 'en' ? `${data.progress} ${activeUnit}` : `${toNepaliNumerals(data.progress)} ${activeUnit}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">{language === 'en' ? 'Annual Target' : 'वार्षिक लक्ष्य'}:</span>
              <span className="font-bold text-amber-400">
                {language === 'en' ? `${data.target} ${activeUnit}` : `${toNepaliNumerals(data.target)} ${activeUnit}`}
              </span>
            </div>
          </div>

          {/* Epoch-to-epoch delta progress */}
          {prevData && (
            <div className="flex items-center justify-between text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <span className="font-bold">
                {language === 'en' ? 'Milestone Velocity' : 'समीक्षा अवधि प्रगति'}:
              </span>
              <span className="font-extrabold text-right">
                {progressDelta >= 0 ? '+' : ''}
                {language === 'en' 
                  ? `${progressDelta} ${activeUnit} (+${rateDelta}%)` 
                  : `${toNepaliNumerals(progressDelta)} ${activeUnit} (+${toNepaliNumerals(rateDelta)}%)`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface CustomSeasonalTooltipProps {
  active?: boolean;
  payload?: { payload: { interval: string | number; avgDailyProgress: number }; value?: number }[];
  language: string;
}

export const TrendAnalysisView: React.FC<TrendAnalysisViewProps> = ({ indicators, metadata, onOpenAbout }) => {
  const { language, t, translateUnit } = useLanguage();
  
  const availableIndicators = useMemo(() => {
    return [...indicators].filter(Boolean).sort((a, b) => {
      const aName = language === 'en' ? (a.nameEn || a.name || '') : (a.name || '');
      const bName = language === 'en' ? (b.nameEn || b.name || '') : (b.name || '');
      return aName.localeCompare(bName);
    });
  }, [indicators, language]);

  const [selectedId, setSelectedId] = useState<string>(() => {
    const defaultInd = indicators.find(ind => ind.annualTarget > 0) || indicators[0];
    return defaultInd ? defaultInd.id : '';
  });

  const selectedIndicator = useMemo(() => {
    return indicators.find(ind => ind.id === selectedId) || null;
  }, [indicators, selectedId]);

  const [chartMode, setChartMode] = useState<'percentage' | 'absolute'>('percentage');

  const trendData = useMemo(() => {
    if (!selectedIndicator) return [];

    const id = selectedIndicator.id;
    const name = selectedIndicator.name;

    const epoch1 = {
      epochId: 1,
      date: '2082/04/01',
      labelEn: 'FY Commencement',
      labelNp: 'आर्थिक वर्ष प्रारम्भ',
      target: selectedIndicator.annualTarget,
      progress: 0,
      completionRate: 0,
    };

    const snapshot1 = HISTORICAL_DATA.find(h => h.id === '2082-11-26');
    const histItem1 = snapshot1?.indicators.find(ind => ind.id === id || ind.name === name);
    const progress2 = histItem1 ? histItem1.annualProgress : Math.round(selectedIndicator.annualProgress * 0.15);
    const target2 = histItem1 ? histItem1.annualTarget : selectedIndicator.annualTarget;
    const epoch2 = {
      epochId: 2,
      date: '2082/11/26',
      labelEn: 'First Quarter Review',
      labelNp: 'पहिलो त्रैमासिक समीक्षा',
      target: target2,
      progress: progress2,
      completionRate: target2 > 0 ? Math.min(100, Math.round((progress2 / target2) * 100)) : 0,
    };

    const snapshot2 = HISTORICAL_DATA.find(h => h.id === '2082-12-30');
    const histItem2 = snapshot2?.indicators.find(ind => ind.id === id || ind.name === name);
    const progress3 = histItem2 ? histItem2.annualProgress : Math.round(selectedIndicator.annualProgress * 0.51);
    const target3 = histItem2 ? histItem2.annualTarget : selectedIndicator.annualTarget;
    const epoch3 = {
      epochId: 3,
      date: '2082/12/30',
      labelEn: 'Mid-Term Evaluation',
      labelNp: 'मध्यावधि मूल्याङ्कन',
      target: target3,
      progress: progress3,
      completionRate: target3 > 0 ? Math.min(100, Math.round((progress3 / target3) * 100)) : 0,
    };

    const progress4 = selectedIndicator.annualProgress;
    const target4 = selectedIndicator.annualTarget;
    const epoch4 = {
      epochId: 4,
      date: metadata?.lastUpdateDate || '2083/02/15',
      labelEn: 'Current Status',
      labelNp: 'हालको कार्यसम्पादन',
      target: target4,
      progress: progress4,
      completionRate: target4 > 0 ? Math.min(120, Math.round((progress4 / target4) * 100)) : 0,
    };

    return [epoch1, epoch2, epoch3, epoch4];
  }, [selectedIndicator, metadata]);

  const trajectoryInsights = useMemo(() => {
    if (!selectedIndicator || trendData.length === 0) return null;
    
    const currentRate = trendData[trendData.length - 1].completionRate;
    const midTermRate = trendData[2].completionRate;
    const q1Rate = trendData[1].completionRate;

    const isImproving = currentRate > midTermRate && midTermRate >= q1Rate;
    const velocity = currentRate - midTermRate;

    let statusType: 'excellent' | 'steady' | 'warning';
    let textEn: string;
    let textNp: string;

    if (currentRate >= 90) {
      statusType = 'excellent';
      textEn = `Outstanding performance! This metric has achieved ${currentRate}% of its annual target. The trajectory shows high, consistent execution speed across all reporting reviews.`;
      textNp = `उत्कृष्ट कार्यसम्पादन! यस सूचकले वार्षिक लक्ष्यको ${toNepaliNumerals(currentRate)}% हासिल गरेको छ। प्रगति मार्गचित्रले सबै रिपोर्टिङ समीक्षाहरूमा उच्च र निरन्तर कार्यान्वयन गति देखाउँदछ।`;
    } else if (currentRate >= 50) {
      statusType = 'steady';
      textEn = `On-track. This indicator stands at ${currentRate}% of the annual target. Execution has steadily accelerated since the Mid-Term Evaluation (+${velocity}% increase). Proceeding at this velocity ensures target fulfillment before fiscal year-end.`;
      textNp = `सही दिशामा। यो सूचक वार्षिक लक्ष्यको ${toNepaliNumerals(currentRate)}% मा छ। मध्यावधि मूल्याङ्कन पछि कार्यसम्पादन गतिमा सुधार (+${toNepaliNumerals(velocity)}% वृद्धि) भएको देखिन्छ। यसै गतिमा अघि बढ्दा आर्थिक वर्षको अन्त्यसम्ममा लक्ष्य हासिल हुने सुनिश्चित हुन्छ।`;
    } else {
      statusType = 'warning';
      textEn = `Action Required. Current progress is at ${currentRate}% of the annual target. The execution speed is lagging behind the projected quarterly milestones. It is recommended to deploy focused divisional support and expedite operations.`;
      textNp = `तुरुन्त ध्यान दिनुपर्ने। हालको प्रगति वार्षिक लक्ष्यको ${toNepaliNumerals(currentRate)}% मात्र रहेको छ। कार्यसम्पादनको गति त्रैमासिक रूपमा प्रक्षेपण गरिएको माइलस्टोन भन्दा पछाडि छ। सम्बन्धित डिभिजनको ध्यान आकर्षित गरी काममा तीव्रता दिन सिफारिस गरिन्छ।`;
    }

    return { statusType, textEn, textNp, velocity, isImproving };
  }, [selectedIndicator, trendData]);

  const inflectionPoints = useMemo(() => {
    if (trendData.length < 3) return [];
    
    const points = [];
    for (let i = 1; i < trendData.length - 1; i++) {
        const prev = trendData[i - 1];
        const curr = trendData[i];
        const next = trendData[i + 1];
        
        const slope1 = curr.completionRate - prev.completionRate;
        const slope2 = next.completionRate - curr.completionRate;
        
        if (Math.abs(slope2 - slope1) > 5) {
            points.push({ ...curr, x: curr.date, y: curr.completionRate });
        }
    }
    return points;
  }, [trendData]);

  const deviationPoints = useMemo(() => {
    return trendData
      .filter(d => Math.abs(d.completionRate - d.seasonalAvg) > 20)
      .map(d => ({ ...d, x: d.date, y: d.completionRate }));
  }, [trendData]);

  if (!selectedIndicator) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
        <p className="text-slate-500">{language === 'en' ? 'No trend indicators available.' : 'कुनै प्रवृत्ति सूचकहरू उपलब्ध छैनन्।'}</p>
      </div>
    );
  }

  const activeName = language === 'en' ? selectedIndicator.nameEn : selectedIndicator.name;
  const activeUnit = translateUnit(selectedIndicator.unit);

  return (
    <motion.div 
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm col-span-12" id="historical-trends-panel"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <TrendingUp size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
              {language === 'en' ? 'Historical Trend Analysis' : 'ऐतिहासिक प्रवृत्ति विश्लेषण'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              {language === 'en' ? 'Annual Targets vs Actual Execution Over Time' : 'समयसँगै वार्षिक लक्ष्यहरू र वास्तविक कार्यान्वयनको तुलना'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              id="indicator-trend-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full sm:w-[320px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-2.5 px-4 pr-10 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none shadow-sm"
            >
              {availableIndicators.map(ind => (
                <option key={ind.id} value={ind.id}>
                  {language === 'en' ? ind.nameEn : ind.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setChartMode('percentage')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${chartMode === 'percentage' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {language === 'en' ? 'Completion %' : 'उपलब्धि %'}
            </button>
            <button
              onClick={() => setChartMode('absolute')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${chartMode === 'absolute' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {language === 'en' ? 'Absolute Value' : 'वास्तविक मान'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-500/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Info size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300">
              {activeName}
            </h4>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                <span>{language === 'en' ? 'All Offices' : 'सबै कार्यालयहरू'}</span>
                <button
                  onClick={() => onOpenAbout?.('offices')}
                  className="font-bold underline cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  {language === 'en' ? 'View All' : 'सबै हेर्नुहोस्'}
                </button>
              </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold font-mono">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{language === 'en' ? 'Category' : 'श्रेणी'}</span>
            <span className="text-indigo-600 dark:text-indigo-400">{t(selectedIndicator.category)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="h-72 sm:h-96 w-full pr-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chartMode}-${selectedId}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'percentage' ? (
                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendCompletionGrad" x1="0" y1="0" x2="0" y2="1">
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
                      <Tooltip 
                        content={
                          <CustomTrendTooltip 
                            language={language} 
                            trendData={trendData} 
                            activeUnit={activeUnit} 
                          />
                        } 
                        cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                      />
                      <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: language === 'en' ? 'Target MET' : 'लक्ष्य पूरा', fill: '#ef4444', fontSize: 9, fontWeight: 700, position: 'insideBottomRight' }} />
                      <Brush dataKey="date" height={30} stroke="#4f46e5" fill="#f8fafc" />
                      <Area 
                        name="Completion"
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#4f46e5" 
                        strokeWidth={3.5} 
                        fillOpacity={1} 
                        fill="url(#trendCompletionGrad)" 
                        activeDot={{ r: 6, strokeWidth: 1, stroke: '#ffffff' }}
                      />
                      <Scatter 
                        data={inflectionPoints}
                        dataKey="y"
                        fill="#ef4444"
                        shape={(props: { cx: number; cy: number }) => {
                            const { cx, cy } = props;
                            return <path d={`M${cx},${cy-10} L${cx+10},${cy+10} L${cx-10},${cy+10} Z`} fill="red" />;
                        }}
                      />
                      <Scatter 
                        data={deviationPoints}
                        dataKey="y"
                        fill="#f59e0b"
                        shape={(props: { cx: number; cy: number }) => {
                            const { cx, cy } = props;
                            return <path d={`M${cx-6},${cy+6} L${cx+6},${cy+6} L${cx},${cy-6} Z`} fill="#f59e0b" stroke="#fff" strokeWidth={1}/>;
                        }}
                      />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendProgressGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="trendTargetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                                <Tooltip 
                        content={
                          <CustomTrendTooltip 
                            language={language} 
                            trendData={trendData} 
                            activeUnit={activeUnit} 
                          />
                        } 
                        cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                      />
                      <Area 
                        name={language === 'en' ? 'Annual Target' : 'वार्षिक लक्ष्य'}
                        type="monotone" 
                        dataKey="target" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5} 
                        strokeDasharray="4 4"
                        fillOpacity={1} 
                        fill="url(#trendTargetGrad)" 
                        activeDot={{ r: 4 }}
                      />
                      <Area 
                        name={language === 'en' ? 'Actual Progress' : 'वास्तविक प्रगति'}
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#trendProgressGrad)" 
                        activeDot={{ r: 6, strokeWidth: 1, stroke: '#ffffff' }}
                      />
                      <Brush dataKey="date" height={30} stroke="#10b981" fill="#f8fafc" />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4">
            {chartMode === 'percentage' ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {language === 'en' ? 'Achievement Completion Rate (%)' : 'उपलब्धि पूरा भएको दर (%)'}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {language === 'en' ? 'Annual Target' : 'वार्षिक लक्ष्य'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {language === 'en' ? 'Actual Progress' : 'वास्तविक प्रगति'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {language === 'en' ? 'Milestone Snapshot Highlights' : 'माइलस्टोन स्न्यापसट मुख्य अंश'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                    {language === 'en' ? 'Current Target' : 'हालको लक्ष्य'}
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                    {language === 'np' 
                      ? `${toNepaliNumerals(selectedIndicator.annualTarget)} ${activeUnit}` 
                      : `${selectedIndicator.annualTarget} ${activeUnit}`}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Target size={18} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                    {language === 'en' ? 'Total Completed' : 'कुल सम्पन्न'}
                  </span>
                  <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">
                    {language === 'np' 
                      ? `${toNepaliNumerals(selectedIndicator.annualProgress)} ${activeUnit}` 
                      : `${selectedIndicator.annualProgress} ${activeUnit}`}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
              </div>
            </div>
          </div>

          {trajectoryInsights && (
            <motion.div 
              layout 
              className="p-5 rounded-2xl border flex flex-col justify-between flex-1 min-h-[160px] relative overflow-hidden transition-all duration-300 bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-indigo-500" />
                  {language === 'en' ? 'Trajectory Insight' : 'प्रगति मार्गचित्र विश्लेषण'}
                </span>
                
                {trajectoryInsights.statusType === 'excellent' ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    {language === 'en' ? 'EXCELLENT' : 'उत्कृष्ट'}
                  </span>
                ) : trajectoryInsights.statusType === 'steady' ? (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-bold border border-indigo-500/20 flex items-center gap-1">
                    <Activity size={10} className="animate-pulse" />
                    {language === 'en' ? 'STEADY' : 'सन्तोषजनक'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-bold border border-rose-500/20 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {language === 'en' ? 'CRITICAL' : 'ध्यान दिनुपर्ने'}
                  </span>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium relative z-10 flex-1">
                {language === 'en' ? trajectoryInsights.textEn : trajectoryInsights.textNp}
              </p>

              {trajectoryInsights.isImproving && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-emerald-500 relative z-10">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    {language === 'en' ? 'Post Mid-Term Velocity' : 'मध्यावधि पछिको प्रगति गति'}
                  </span>
                  <span>
                    +{language === 'np' ? toNepaliNumerals(trajectoryInsights.velocity) : trajectoryInsights.velocity}%
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>


    </motion.div>
  );
};
