import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Indicator } from '../types';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  filteredIndicators: Indicator[]; // the indicators matching current dashboard filter
  onGenerate: (selectedIndicators: Indicator[], options: { customTitle: string; showSummary: boolean; viewFormat: string }) => void;
}

const MiniPreview = ({ type }: { type: string }) => {
  const baseClasses = "w-12 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col gap-0.5 p-1 shadow-inner border border-slate-200 dark:border-slate-700";
  
  if (type === 'table') {
    return (
      <div className={baseClasses}>
        <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-600 rounded-sm" />
        <div className="flex gap-0.5">
          <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-700 rounded-sm" />
          <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-700 rounded-sm" />
        </div>
      </div>
    );
  }
  if (type === 'chart') {
    return (
      <div className={`${baseClasses} items-end flex-row justify-center gap-0.5 pt-2`}>
        <div className="w-2 h-3 bg-[#4dc3ec] dark:bg-[#0099DA] rounded-sm" />
        <div className="w-2 h-5 bg-[#0099DA] dark:bg-[#0099DA] rounded-sm" />
        <div className="w-2 h-2 bg-[#7fd3ee] dark:bg-[#0074A6] rounded-sm" />
      </div>
    );
  }
  if (type === 'card') {
    return (
      <div className={`${baseClasses} grid grid-cols-2 gap-0.5`}>
        <div className="bg-slate-300 dark:bg-slate-600 rounded-sm" />
        <div className="bg-slate-300 dark:bg-slate-600 rounded-sm" />
        <div className="bg-slate-300 dark:bg-slate-600 rounded-sm" />
        <div className="bg-slate-300 dark:bg-slate-600 rounded-sm" />
      </div>
    );
  }
  if (type === 'trend') {
    return (
      <div className={baseClasses}>
        <svg viewBox="0 0 40 30" className="w-full h-full text-[#0099DA]" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M2 28 L15 15 L25 20 L38 5" />
        </svg>
      </div>
    );
  }
  return null;
};

export function ReportBuilderModal({
  isOpen,
  onClose,
  indicators,
  filteredIndicators,
  onGenerate
}: ReportBuilderModalProps) {
  const { language, t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    // Default to including indicators currently visible in the dashboard
    const initial: Record<string, boolean> = {};
    (filteredIndicators || []).forEach(ind => {
      if (ind && ind.id) {
        initial[ind.id] = true;
      }
    });
    return initial;
  });

  const [viewFormat, setViewFormat] = useState('table');
  
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalFilteredIndicators = useMemo(() => {
    return (indicators || []).filter(Boolean);
  }, [indicators]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    modalFilteredIndicators.forEach(ind => {
      next[ind.id] = true;
    });
    setSelectedIds(prev => ({ ...prev, ...next }));
  };

  const handleClearAll = () => {
    const next: Record<string, boolean> = { ...selectedIds };
    modalFilteredIndicators.forEach(ind => {
      next[ind.id] = false;
    });
    setSelectedIds(next);
  };

  const handleGenerate = () => {
    const selectedList = indicators.filter(ind => selectedIds[ind.id]);
    onGenerate(selectedList, { customTitle: '', showSummary: true, viewFormat });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] w-full max-w-2xl h-[92vh] sm:h-[90vh] flex flex-col shadow-2xl relative overflow-hidden z-10"
        >
          {/* Top border accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#dc2626] via-[#0099DA] to-[#00ADF7]" />

          {/* Title bar - narrow branding */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-sm">
                <img
                  src="/GovtLogo.svg"
                  alt="Government of Nepal"
                  className="w-[66%] h-[66%] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="leading-tight">
                <p className="font-display text-[0.7rem] sm:text-[0.8rem] font-black uppercase text-slate-800 dark:text-white tracking-tight">DORPTS</p>
                <p className="text-[0.55rem] sm:text-[0.6rem] font-extrabold uppercase tracking-tight text-[#0099DA] dark:text-[#00ADF7] leading-none">
                  {t('reportBuilder') || 'Consolidated Report Builder'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer hover:rotate-90"
            >
              <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scroll">
            
            {/* 2 & 3. Indicator Selection */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] sm:text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                  <span>{t('selectIndicators') || 'Select Indicators'}</span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-[#0099DA]/10 dark:bg-[#0099DA]/10 text-[#0099DA] dark:text-[#00ADF7] font-mono text-[8px] sm:text-[9px] font-black">
                    {selectedCount}/{indicators.length}
                  </span>
                </h3>
                
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={handleSelectAll} className="text-[8px] sm:text-[9px] font-black text-[#0099DA] hover:underline uppercase tracking-wider">All</button>
                  <button onClick={handleClearAll} className="text-[8px] sm:text-[9px] font-black text-slate-400 hover:underline uppercase tracking-wider">Clear</button>
                </div>
              </div>

              {/* Checklist */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950/40 shadow-inner">
                <div className="max-h-[30vh] sm:max-h-[35vh] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50 custom-scroll">
                  {modalFilteredIndicators.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                      {language === 'en' ? 'No indicators found matching current filter.' : 'मिल्दो सूचक फेला परेन।'}
                    </div>
                  ) : (
                    modalFilteredIndicators.map(ind => {
                      const isSelected = !!selectedIds[ind.id];
                      const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
                      const progressPct = ind.annualTarget > 0 ? (ind.annualProgress / ind.annualTarget) * 100 : 0;
                      
                      return (
                        <div
                          key={ind.id}
                          onClick={() => handleToggle(ind.id)}
                          className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 transition-all cursor-pointer text-left select-none ${
                            isSelected 
                              ? 'bg-[#0099DA]/10 dark:bg-[#0099DA]/10 border-l-4 border-l-[#0099DA]' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#0099DA] border-[#0099DA] text-white' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}>
                            {isSelected && <Check strokeWidth={3} className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                              {name}
                            </p>

                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, progressPct)}%` }}
                                  transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.1 }}
                                  className={`h-full rounded-full ${
                                    progressPct >= 100 
                                      ? 'bg-emerald-500' 
                                      : progressPct > 0 
                                        ? 'bg-[#0099DA]' 
                                        : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 4 & 5. Reports View Options & Preview */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-1">
                {language === 'en' ? 'Report View Options' : 'प्रतिवेदन हेर्ने विकल्पहरू'}
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                
                {/* 4. Format Tabs (Left Side) */}
                <div className="flex-1 w-full pb-1">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'table', labelEn: 'Table', labelNe: 'तालिका' },
                      { id: 'chart', labelEn: 'Charts', labelNe: 'चार्ट' },
                      { id: 'card', labelEn: 'Cards', labelNe: 'कार्डहरू' },
                      { id: 'trend', labelEn: 'Trends', labelNe: 'प्रवृत्ति' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setViewFormat(mode.id)}
                        className={`flex-1 min-w-[70px] px-3 sm:px-4 py-2.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                          viewFormat === mode.id
                            ? 'bg-[#0099DA] border-[#0099DA] text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#0099DA]/50'
                        }`}
                      >
                        {language === 'en' ? mode.labelEn : mode.labelNe}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Preview (Right Side) */}
                <div className="shrink-0 flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
                  <div className="text-right flex-1 md:flex-none">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Preview</p>
                    <p className="text-[10px] font-bold text-[#0099DA] dark:text-[#00ADF7] capitalize">{viewFormat}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                    <MiniPreview type={viewFormat} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
            </button>
            
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleGenerate}
                disabled={selectedCount === 0}
                className={`px-4 sm:px-8 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black rounded-xl text-white shadow-xl transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCount === 0 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#0099DA] hover:bg-[#0074A6] shadow-[#0099DA]/30 active:scale-95'
                }`}
              >
                <Printer strokeWidth={2.5} className="w-3.5 h-3.5 sm:w-[16px] sm:h-[16px]" />
                {language === 'en' ? 'Generate' : 'तयार गर्नुहोस्'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
