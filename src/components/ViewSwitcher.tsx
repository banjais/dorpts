import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, Table as TableIcon, ChevronUp, LayoutDashboard, Gauge, Layers, Activity, LayoutGrid } from 'lucide-react';
import { ViewMode } from '../types';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onToggle 
}) => {
  const { language } = useLanguage();

  const options = [
    { id: 'dashboard' as ViewMode, labelEn: 'HOME', labelNp: 'गृहपृष्ठ', icon: <Gauge size={18} /> },
    { id: 'card' as ViewMode, labelEn: 'Card View', labelNp: 'कार्ड दृश्य', icon: <LayoutGrid size={18} /> },
    { id: 'chart' as ViewMode, labelEn: 'Chart View', labelNp: 'चार्ट दृश्य', icon: <BarChart3 size={18} /> },
    { id: 'table' as ViewMode, labelEn: 'Table View', labelNp: 'तालिका दृश्य', icon: <TableIcon size={18} /> },
    { id: 'heatmap' as ViewMode, labelEn: 'HEATMAP', labelNp: 'हिटम्याप', icon: <Activity size={18} /> },
    { id: 'institutional' as ViewMode, labelEn: 'INSTITUTIONAL', labelNp: 'संस्थागत', icon: <Layers size={18} /> },
  ] as const;

  return (
    <div className="flex flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col gap-2 mb-2"
          >
            {options.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onViewChange(option.id as ViewMode);
                  onToggle();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                  currentView === option.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800'
                }`}
              >
                {option.icon}
                <span className="text-xs font-bold uppercase tracking-widest">{language === 'en' ? option.labelEn : option.labelNp}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="view-switcher-fab"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-180' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isOpen ? <ChevronUp size={20} /> : <LayoutDashboard size={20} />}
      </motion.button>
    </div>
  );
};