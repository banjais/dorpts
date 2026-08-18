import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, BookOpen, Info, Target, Building, User, MessageSquare } from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryColor } from '../utils/category';
import { ProgressNotesSection } from './ProgressNotesSection';

interface IndicatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator | null;
  onOpenComments?: (indicator: Indicator) => void;
  categoryThemes?: Record<string, string>;
  addToast?: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({ isOpen, onClose, indicator, onOpenComments, categoryThemes, addToast }) => {
  const { language, translateUnit } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && indicator && (() => {
        const catColor = getCategoryColor(indicator.category, categoryThemes);
        const primaryName = language === 'en' ? (indicator.nameEn || indicator.name) : indicator.name;
        const secondaryName = language === 'en' ? indicator.name : (indicator.nameEn || indicator.name);
        
        return (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
             className="absolute inset-0 bg-slate-950/80 dark:bg-black/70 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 text-white rounded-2xl shadow-lg transition-colors duration-500"
                  style={{ backgroundColor: catColor.hex, boxShadow: `0 10px 15px -3px ${catColor.hex}40` }}
                >
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {primaryName}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {secondaryName}
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
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Target size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Annual Target' : 'वार्षिक लक्ष्य'}</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{indicator.annualTarget} <span className="text-sm font-bold text-slate-400">{translateUnit(indicator.unit)}</span></div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'en' ? 'Progress' : 'प्रगति'}</span>
                  </div>
                  <div className="text-xl font-black transition-colors duration-500" style={{ color: catColor.hex }}>{indicator.annualProgress} <span className="text-sm font-bold text-slate-400">{translateUnit(indicator.unit)}</span></div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-3">{language === 'en' ? 'Description' : 'विवरण'}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {indicator.details || (language === 'en' ? 'No description available.' : 'विवरण उपलब्ध छैन।')}
                </p>
              </div>

              {/* Progress Notes Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                <ProgressNotesSection indicator={indicator} addToast={addToast} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <BookOpen size={20} className="text-indigo-500 shrink-0" />
                  <a 
                      href={indicator.docLink || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                  >
                      {language === 'en' ? 'View Source Documentation' : 'स्रोत कागजात हेर्नुहोस्'}
                  </a>
                </div>

                {onOpenComments && (
                  <button 
                      onClick={() => {
                        onClose();
                        onOpenComments(indicator);
                      }}
                      className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-left hover:bg-emerald-100/50 dark:hover:bg-emerald-950/45 transition-colors cursor-pointer w-full"
                  >
                      <MessageSquare size={20} className="text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {language === 'en' ? 'Discussion & Comments' : 'छलफल र टिप्पणीहरू'}
                      </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        );
      })()}
    </AnimatePresence>
  );
};
