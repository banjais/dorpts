import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Clock, History, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { DataHealthMonitor } from './DataHealthMonitor';

interface DataHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  retryKey?: number;
}

export const DataHealthModal: React.FC<DataHealthModalProps> = ({ isOpen, onClose, indicators, metadata, retryKey }) => {
  const { language } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {language === 'en' ? 'Administrative Data Health Review' : 'प्रशासकीय डेटा स्वास्थ्य समीक्षा'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {language === 'en' ? 'Identifying Integrity Gaps & Stale Records' : 'अखण्डता अन्तराल र पुरानो रेकर्डहरू पहिचान गर्दै'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Stale Data' : 'पुरानो डेटा'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {language === 'en' ? 'Indicators not verified within the last 30 days.' : 'पछिल्लो ३० दिनभित्र प्रमाणित नभएका सूचकहरू।'}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
                      <History size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Missing History' : 'इतिहास हराइरहेको'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {language === 'en' ? 'Indicators with no recorded historical snapshots.' : 'कुनै ऐतिहासिक स्न्यापसट रेकर्ड नभएका सूचकहरू।'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Total Indicators' : 'कुल सूचकहरू'}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{indicators.length}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <DataHealthMonitor indicators={indicators} metadata={metadata} retryKey={retryKey} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/10"
              >
                {language === 'en' ? 'Complete Review' : 'समीक्षा पूरा गर्नुहोस्'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
