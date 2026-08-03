import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, LayoutGrid, BarChart2, Activity, TrendingUp, Layers, Sparkles, Table } from 'lucide-react';
import { ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuickNavDashboardProps {
  onNavigate: (mode: ViewMode) => void;
}

export const QuickNavDashboard: React.FC<QuickNavDashboardProps> = ({ onNavigate }) => {
  const { language } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: language === 'en' ? 'Dashboard' : 'ड्यासबोर्ड', icon: <LayoutDashboard size={20} /> },
    { id: 'card', label: language === 'en' ? 'Card View' : 'कार्ड दृश्य', icon: <LayoutGrid size={20} /> },
    { id: 'table', label: language === 'en' ? 'Table View' : 'तालिका दृश्य', icon: <Table size={20} /> },
    { id: 'trend', label: language === 'en' ? 'Trends' : 'प्रवृत्ति', icon: <TrendingUp size={20} /> },
    { id: 'heatmap', label: language === 'en' ? 'Heatmap' : 'हिटम्याप', icon: <Activity size={20} /> },
    { id: 'institutional', label: language === 'en' ? 'Institutional' : 'संस्थागत', icon: <Layers size={20} /> },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
      {navItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(item.id as ViewMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:text-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-700 dark:text-slate-300"
        >
          <div className="text-indigo-500">{item.icon}</div>
          <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};
