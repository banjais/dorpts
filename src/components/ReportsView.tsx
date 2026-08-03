import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Printer, FileText, Download, Share2, Filter, Search, Check, ChevronRight, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Indicator } from '../types';

interface ReportsViewProps {
  indicators: Indicator[];
  onGenerateReport: (selectedIndicators: Indicator[], options: { viewFormat: string }) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ indicators, onGenerateReport }) => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    indicators.forEach(ind => {
      initial[ind.id] = true;
    });
    return initial;
  });
  const [viewFormat, setViewFormat] = useState('table');

  const filteredIndicators = useMemo(() => {
    return indicators.filter(ind => {
      const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [indicators, searchQuery, language]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const next = { ...selectedIds };
    filteredIndicators.forEach(ind => { next[ind.id] = true; });
    setSelectedIds(next);
  };

  const handleClearAll = () => {
    const next = { ...selectedIds };
    filteredIndicators.forEach(ind => { next[ind.id] = false; });
    setSelectedIds(next);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 pb-24 lg:pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            {language === 'en' ? 'Report Management Center' : 'रिपोर्ट व्यवस्थापन केन्द्र'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {language === 'en' 
              ? 'Configure and export comprehensive performance reports for executive review.' 
              : 'कार्यकारी समीक्षाको लागि विस्तृत कार्यसम्पादन रिपोर्टहरू कन्फिगर र निर्यात गर्नुहोस्।'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const selectedList = indicators.filter(ind => selectedIds[ind.id]);
              onGenerateReport(selectedList, { viewFormat });
            }}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
              selectedCount === 0 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            <Printer size={18} />
            {language === 'en' ? 'Generate Report' : 'रिपोर्ट तयार गर्नुहोस्'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter size={14} />
              {language === 'en' ? 'Report Configuration' : 'रिपोर्ट कन्फिगरेसन'}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-3">
                  {language === 'en' ? 'Presentation Format' : 'प्रस्तुतीकरण ढाँचा'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'table', label: 'Table' },
                    { id: 'chart', label: 'Charts' },
                    { id: 'card', label: 'Cards' },
                    { id: 'trend', label: 'Trends' },
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setViewFormat(format.id)}
                      className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all ${
                        viewFormat === format.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-3">
                  {language === 'en' ? 'Quick Actions' : 'द्रुत कार्यहरू'}
                </label>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <Download size={16} className="text-indigo-500" />
                      {language === 'en' ? 'Export as PDF' : 'PDF को रूपमा निर्यात'}
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <Share2 size={16} className="text-indigo-500" />
                      {language === 'en' ? 'Share Report' : 'रिपोर्ट साझा गर्नुहोस्'}
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Selection Panel */}
        <div className="lg:col-span-8">
          <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} />
                {language === 'en' ? 'Content Selection' : 'सामग्री छनोट'}
                <span className="ml-2 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px]">
                  {selectedCount} / {indicators.length}
                </span>
              </h3>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder={language === 'en' ? 'Search indicators...' : 'सूचकहरू खोज्नुहोस्...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mb-4 px-1">
              <button onClick={handleSelectAll} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Select All</button>
              <button onClick={handleClearAll} className="text-[10px] font-black text-slate-400 uppercase hover:underline">Clear Selection</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px] pr-2 custom-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredIndicators.map(ind => {
                  const isSelected = !!selectedIds[ind.id];
                  const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
                  
                  return (
                    <motion.div
                      key={ind.id}
                      layout
                      onClick={() => handleToggle(ind.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-500/30 ring-1 ring-indigo-500/20' 
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate uppercase tracking-tighter">
                          {t(ind.category)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
