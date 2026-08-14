import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import {
  BarChart3,
  PieChart as PieChartIcon,
  LayoutGrid,
  LineChart as LineChartIcon,
  Activity,
  Minimize2,
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
  defaultInsightTab?: 'health' | 'category' | 'indicators' | 'trends' | 'heatmap';
  onNavigateToView?: (view: string) => void;
}

export const VisualInsightsView: React.FC<VisualInsightsViewProps> = ({
  indicators,
  metadata,
  updatesHistory = [],
  onOpenAbout,
  defaultInsightTab = 'health',
  onNavigateToView,
}) => {
  const { language, t } = useLanguage();
  const [insightTab, setInsightTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>(defaultInsightTab);
  const [portfolioMode, setPortfolioMode] = useState<'bar' | 'pie'>('bar');
  const [categoryMode, setCategoryMode] = useState<'bar' | 'pie'>('bar');

  

  const tabContentHeight = 'min-h-[300px]';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 overflow-hidden">
      <div className="px-5 sm:px-6 py-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
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
          {onNavigateToView && (
            <button
              onClick={() => {
                onNavigateToView('dashboard');
                window.dispatchEvent(new CustomEvent('dismiss-card', { detail: { cardId: 'visual-insights' } }));
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              title={language === 'en' ? 'Reduce / Collapse Card' : 'कार्ड घटाउनुहोस् / सानो बनाउनुहोस्'}
            >
              <Minimize2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="uppercase tracking-wider">{language === 'en' ? 'Reduce' : 'घटाउनुहोस्'}</span>
            </button>
          )}
        </div>

        {/* Chart type tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setInsightTab('health'); triggerHaptic('light'); }}
            title={language === 'en' ? 'Health' : 'पोर्टफोलियो'}
            className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              insightTab === 'health' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <PieChartIcon size={16} />
          </button>
          <button
            onClick={() => { setInsightTab('category'); triggerHaptic('light'); }}
            title={language === 'en' ? 'Category' : 'वर्ग'}
            className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              insightTab === 'category' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => { setInsightTab('indicators'); triggerHaptic('light'); }}
            title={language === 'en' ? 'Indicators' : 'सूचकहरू'}
            className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              insightTab === 'indicators' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => { setInsightTab('trends'); triggerHaptic('light'); }}
            title={language === 'en' ? 'Trends' : 'प्रवृत्तिहरू'}
            className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              insightTab === 'trends' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <LineChartIcon size={16} />
          </button>
          <button
            onClick={() => { setInsightTab('heatmap'); triggerHaptic('light'); }}
            title={language === 'en' ? 'Heatmap' : 'हिटम्याप'}
            className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              insightTab === 'heatmap' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <Activity size={16} />
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
          {insightTab === 'category' && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-white/5">
              <button
                onClick={() => setCategoryMode('bar')}
                className={`p-1.5 rounded-lg transition-all ${categoryMode === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white'}`}
                title={language === 'en' ? 'Bar' : 'बार'}
              >
                <BarChart3 size={12} />
              </button>
              <button
                onClick={() => setCategoryMode('pie')}
                className={`p-1.5 rounded-lg transition-all ${categoryMode === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white'}`}
                title={language === 'en' ? 'Pie' : 'पाई'}
              >
                <PieChartIcon size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Chart content */}
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {insightTab === 'health' && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={tabContentHeight}
              >
                <PortfolioHealthChart indicators={indicators} t={t} mode={portfolioMode} height={220} />
              </motion.div>
            )}
            {insightTab === 'category' && (
              <motion.div
                key="category"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={tabContentHeight}
              >
                <CategoryInsightsChart indicators={indicators} t={t} language={language} height={220} mode={categoryMode} />
              </motion.div>
            )}
            {insightTab === 'indicators' && (
              <motion.div
                key="indicators"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={tabContentHeight}
              >
                <MetricsChart indicators={indicators} />
              </motion.div>
            )}
            {insightTab === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={tabContentHeight}
              >
                <TrendAnalysisView indicators={indicators} metadata={metadata} onOpenAbout={onOpenAbout} />
              </motion.div>
            )}
            {insightTab === 'heatmap' && (
              <motion.div
                key="heatmap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={tabContentHeight}
              >
                <IndicatorHeatmap indicators={indicators} updatesHistory={updatesHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
