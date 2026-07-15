import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WifiOff, 
  Database, 
  Search, 
  CheckCircle, 
  Layers, 
  ArrowLeftRight, 
  RefreshCw, 
  X,
  AlertCircle,
  Activity,
  Sliders,
  Sparkles,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Indicator } from '../types';

interface OfflineSummaryDashboardProps {
  indicators: Indicator[];
  pendingWrites: any[];
  onDismiss: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
}

const toNepaliNumerals = (numStr: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return numStr
    .toString()
    .split('')
    .map((char) => {
      const index = parseInt(char, 10);
      return !isNaN(index) ? nepaliDigits[index] : char;
    })
    .join('');
};

export const OfflineSummaryDashboard: React.FC<OfflineSummaryDashboardProps> = ({
  indicators,
  pendingWrites,
  onDismiss,
  onManualSync,
  isSyncing,
}) => {
  const { language, translateOffice, translateUnit } = useLanguage();
  const isEn = language === 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Translation helpers
  const t = (key: string) => {
    const translations: Record<string, { en: string; np: string }> = {
      'Infrastructure Creation': { en: 'Infrastructure Creation', np: 'पूर्वाधार निर्माण' },
      'Maintenance': { en: 'Road Maintenance', np: 'सडक मर्मतसम्भार' },
      'Employment Creation': { en: 'Employment Creation', np: 'रोजगारी सिर्जना' },
      'Budget Utilization': { en: 'Budget Utilization', np: 'बजेट उपयोग' },
      'Governance': { en: 'Governance & Auditing', np: 'सुशासन र लेखापरीक्षण' },
    };
    return translations[key] ? (isEn ? translations[key].en : translations[key].np) : key;
  };

  // Extract all categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(indicators.map(i => i.category)));
    return ['All', ...unique];
  }, [indicators]);

  // Compute cache statistics
  const stats = useMemo(() => {
    if (!indicators.length) return { total: 0, avgCompletion: 0, completed: 0, critical: 0 };
    
    let totalCompletion = 0;
    let completedCount = 0;
    let criticalCount = 0;

    indicators.forEach(ind => {
      const target = ind.annualTarget || 1;
      const progress = ind.annualProgress || 0;
      const rate = Math.min(100, Math.round((progress / target) * 100));
      totalCompletion += rate;
      if (rate >= 100) completedCount++;
      if (rate < 40) criticalCount++;
    });

    return {
      total: indicators.length,
      avgCompletion: Math.round(totalCompletion / indicators.length),
      completed: completedCount,
      critical: criticalCount
    };
  }, [indicators]);

  // Filter local cached indicators
    const filteredIndicators = useMemo(() => {
    return indicators.filter(ind => {
      if (!ind) return false;
      const matchesCategory = selectedCategory === 'All' || ind.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        (ind.nameEn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ind.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ind.id || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [indicators, selectedCategory, searchQuery]);

  return (
    <div id="offline-summary-dashboard" className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      
      {/* Top Banner indicating Offline State */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 dark:from-amber-500/5 dark:via-rose-500/5 dark:to-indigo-500/5 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Abstract background decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 dark:bg-amber-500/10 border border-amber-500/30 rounded-full">
              <WifiOff size={14} className="text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {isEn ? 'Offline Mode Active' : 'अफलाइन मोड सक्रिय'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">
              {isEn ? 'Offline Summary Dashboard' : 'अफलाइन सारांश ड्यासबोर्ड'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {isEn 
                ? 'We detected zero network connectivity. The application is now serving securely cached local data. Any updates you make will be buffered and automatically synced once you go back online.'
                : 'हामीले नेटवर्क जडान नभएको फेला पार्‍यौं। यो एप अहिले सुरक्षित रूपमा क्यास गरिएको स्थानीय डेटा मार्फत चलिरहेको छ। तपाईंले गर्नुभएका सबै परिमार्जनहरू यहाँ सुरक्षित रहनेछन् र अनलाइन आउने बित्तिकै स्वचालित रूपमा सिंक हुनेछन्।'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
              {isEn 
                ? (isSyncing ? 'Checking...' : 'Check Connection') 
                : (isSyncing ? 'जाँच्दै...' : 'सम्पर्क जाँच्नुहोस्')}
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 border border-indigo-500 cursor-pointer"
            >
              <span>{isEn ? 'Continue to Full App' : 'पूर्ण एपमा जानुहोस्'}</span>
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Cached */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {isEn ? 'Cached Indicators' : 'क्यास गरिएका सूचकहरू'}
            </span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {isEn ? stats.total : toNepaliNumerals(stats.total)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <CheckCircle size={10} className="text-emerald-500" />
              <span>{isEn ? 'Fully accessible offline' : 'अफलाइन पहुँचयोग्य'}</span>
            </p>
          </div>
        </motion.div>

        {/* Avg Completion Rate */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {isEn ? 'Avg Completion' : 'औसत उपलब्धि'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/10">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {isEn ? `${stats.avgCompletion}%` : `${toNepaliNumerals(stats.avgCompletion)}%`}
            </h3>
            <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.avgCompletion}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.1 }}
                className="bg-indigo-500 h-full rounded-full" 
              />
            </div>
          </div>
        </motion.div>

        {/* Offline Changes Buffer */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {isEn ? 'Pending Changes' : 'बाँकी परिमार्जनहरू'}
            </span>
            <div className={`p-2 rounded-xl border ${pendingWrites.length > 0 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/5'}`}>
              <ArrowLeftRight size={16} className={pendingWrites.length > 0 ? 'animate-pulse' : ''} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {isEn ? pendingWrites.length : toNepaliNumerals(pendingWrites.length)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <Activity size={10} className={pendingWrites.length > 0 ? 'text-amber-500 animate-spin' : 'text-slate-400'} />
              <span>
                {pendingWrites.length > 0 
                  ? (isEn ? 'Waiting for connectivity to sync' : 'सिङ्क्रोनाइजेसनको प्रतिक्षामा')
                  : (isEn ? 'Local state fully synchronized' : 'स्थानीय अवस्था पूर्ण रूपमा सिङ्क छ')}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Categories Health */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {isEn ? 'Completed Tasks' : 'सम्पन्न कार्यहरू'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/10">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {isEn ? stats.completed : toNepaliNumerals(stats.completed)}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" />
              <span>
                {isEn 
                  ? `${stats.critical} critical area(s) offline` 
                  : `${toNepaliNumerals(stats.critical)} गम्भीर क्षेत्र(हरू) अफलाइन`}
              </span>
            </p>
          </div>
        </motion.div>

      </div>

      {/* Main Filter & Explorer Interface */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header containing Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {isEn ? 'Cached Local Indicators' : 'क्यास गरिएका स्थानीय सूचकहरू'}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isEn ? 'Showing indicators stored in your browser storage cache' : 'तपाईंको ब्राउजर स्टोरेज क्यासमा सुरक्षित सूचकहरू'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={isEn ? "Search indicators..." : "सूचकहरू खोज्नुहोस्..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-xs text-slate-800 dark:text-slate-100 font-bold rounded-xl outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-400"
              />
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Category Select Button switcher for mobile and nice flex list for desktop */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider py-1.5 px-3 rounded-lg outline-none cursor-pointer w-full"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {cat === 'All' ? (isEn ? 'All Categories' : 'सबै श्रेणीहरू') : t(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Indicators List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredIndicators.map((ind, index) => {
              const target = ind.annualTarget || 1;
              const progress = ind.annualProgress || 0;
              const rate = Math.min(100, Math.round((progress / target) * 100));
              
              // Check if there is an offline write pending for this specific indicator
              const hasPending = pendingWrites.some(pw => pw.id === ind.id);

              return (
                <motion.div
                  key={ind.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                  className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all hover:border-slate-300 dark:hover:border-white/10 group relative"
                >
                  {/* Category strip */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500">
                      {t(ind.category)}
                    </span>
                    {hasPending && (
                      <div className="space-y-1 w-full">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                          {isEn ? 'Syncing...' : 'सिंक हुँदै...'}
                        </span>
                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                          <motion.div 
                            className="h-full bg-amber-500 absolute top-0 left-0"
                            initial={{ width: '0%' }}
                            animate={{ width: ['0%', '100%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight line-clamp-2 leading-snug">
                    {isEn ? ind.nameEn : ind.name}
                  </h4>

                  {/* Progress segment */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        {isEn ? 'Completion Rate' : 'उपलब्धि दर'}:
                      </span>
                      <span className={`font-black ${rate >= 100 ? 'text-emerald-500' : rate < 40 ? 'text-rose-500' : 'text-indigo-500'}`}>
                        {isEn ? `${rate}%` : `${toNepaliNumerals(rate)}%`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 + (index * 0.05) }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          rate >= 100 
                            ? 'bg-emerald-500' 
                            : rate < 40 
                              ? 'bg-rose-500 animate-pulse' 
                              : 'bg-indigo-500'
                        }`} 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono pt-1 text-slate-500 dark:text-slate-400">
                      <span>
                        {isEn ? 'Progress' : 'प्रगति'}: <b className="text-slate-700 dark:text-slate-300">{isEn ? ind.annualProgress : toNepaliNumerals(ind.annualProgress)} {translateUnit(ind.unit)}</b>
                      </span>
                      <span>
                        {isEn ? 'Target' : 'लक्ष्य'}: <b className="text-slate-700 dark:text-slate-300">{isEn ? ind.annualTarget : toNepaliNumerals(ind.annualTarget)} {translateUnit(ind.unit)}</b>
                      </span>
                    </div>
                  </div>

                  {/* Office / Owner metadata footer */}
                  {ind.office && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sliders size={10} className="text-slate-400" />
                        <span>{translateOffice(ind.office)}</span>
                      </span>
                      {ind.updatedAt && (
                        <span>
                          {isEn 
                            ? `Updated: ${ind.updatedAt.split('T')[0]}`
                            : `अद्यावधिक: ${toNepaliNumerals(ind.updatedAt.split('T')[0])}`}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredIndicators.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
              <AlertCircle size={24} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-500">
                {isEn ? 'No cached indicators match your filter criteria' : 'फिल्टरसँग मेल खाने कुनै क्यास गरिएका सूचकहरू फेला परेनन्'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
