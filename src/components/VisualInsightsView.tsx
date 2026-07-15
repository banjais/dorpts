import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import {
  BarChart3,
  PieChart as PieChartIcon,
  LayoutGrid,
  LineChart as LineChartIcon,
  Activity,
} from 'lucide-react';
import { PortfolioHealthChart } from './PortfolioHealthChart';
import { IndicatorHeatmap } from './IndicatorHeatmap';
import { MetricsChart } from './MetricsChart';
import { TrendAnalysisView } from './TrendAnalysisView';
import CategoryInsightsChart from './CategoryInsightsChart';

interface VisualInsightsViewProps {
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  updatesHistory?: any[];
  onOpenAbout?: (tab?: string) => void;
}

export const VisualInsightsView: React.FC<VisualInsightsViewProps> = ({
  indicators,
  metadata,
  updatesHistory = [],
  onOpenAbout,
}) => {
  const { language, t } = useLanguage();
  const [insightTab, setInsightTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>('health');
  const [portfolioMode, setPortfolioMode] = useState<'bar' | 'pie'>('bar');

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-500 text-white rounded-xl">
            <BarChart3 size={18} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Visual Insights' : 'दृश्यात्मक अन्तर्दृष्टि'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Optional charts & analytics' : 'वैकल्पिक चार्ट र विश्लेषण'}
            </p>
          </div>
        </div>

        {/* Chart type tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setInsightTab('health'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              insightTab === 'health' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <PieChartIcon size={12} />
            {language === 'en' ? 'Health' : 'पोर्टफोलियो'}
          </button>
          <button
            onClick={() => { setInsightTab('category'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              insightTab === 'category' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <LayoutGrid size={12} />
            {language === 'en' ? 'Category' : 'वर्ग'}
          </button>
          <button
            onClick={() => { setInsightTab('indicators'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              insightTab === 'indicators' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <BarChart3 size={12} />
            {language === 'en' ? 'Indicators' : 'सूचकहरू'}
          </button>
          <button
            onClick={() => { setInsightTab('trends'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              insightTab === 'trends' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <LineChartIcon size={12} />
            {language === 'en' ? 'Trends' : 'प्रवृत्तिहरू'}
          </button>
          <button
            onClick={() => { setInsightTab('heatmap'); triggerHaptic('light'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
              insightTab === 'heatmap' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <Activity size={12} />
            {language === 'en' ? 'Heatmap' : 'हिटम्याप'}
          </button>

          {insightTab === 'health' && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-white/5">
              <button
                onClick={() => setPortfolioMode('bar')}
                className={`p-1.5 rounded-lg transition-all ${portfolioMode === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white'}`}
                title={language === 'en' ? 'Bar' : 'बार'}
              >
                <BarChart3 size={12} />
              </button>
              <button
                onClick={() => setPortfolioMode('pie')}
                className={`p-1.5 rounded-lg transition-all ${portfolioMode === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white'}`}
                title={language === 'en' ? 'Pie' : 'पाई'}
              >
                <PieChartIcon size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Chart content */}
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 sm:p-6">
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
  );
};
