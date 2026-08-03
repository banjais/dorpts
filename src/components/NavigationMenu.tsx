import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  TrendingUp,
  Activity,
  Building2,
} from 'lucide-react';
import { MainView } from '../types';
import { useLanguage } from '../context/LanguageContext';

  export const NAV_ITEMS = [
  { id: 'dashboard' as MainView, labelEn: 'HOME', labelNp: 'गृहपृष्ठ', icon: <LayoutDashboard size={16} /> },
  { id: 'trends' as MainView, labelEn: 'TRENDS', labelNp: 'प्रवृत्ति', icon: <TrendingUp size={16} /> },
  { id: 'heatmap' as MainView, labelEn: 'HEATMAP', labelNp: 'हिटम्याप', icon: <Activity size={16} /> },
  { id: 'institutional' as MainView, labelEn: 'INSTITUTIONAL', labelNp: 'संस्थागत', icon: <Building2 size={16} /> },
];

interface NavigationMenuProps {
  activeView: MainView;
  onViewChange: (view: MainView) => void;
  onOpenReportBuilder?: () => void;
  isScrolled?: boolean;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  activeView,
  onViewChange,
  onOpenReportBuilder,
  isScrolled = false
}) => {
  const { language } = useLanguage();

  return (
    <nav className={`fixed top-[57px] sm:top-[65px] right-3 sm:right-5 z-[5001] ${isScrolled ? 'scale-[0.85] origin-top-right' : ''}`}>
      <div className="flex flex-row items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 p-0.5 sm:p-1 rounded-full border border-white/70 dark:border-slate-700/50 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(item.id as MainView)}
              className={`relative px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-colors duration-200 flex items-center gap-1 justify-center z-10 ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-white'
              }`}
              title={language === 'en' ? item.labelEn : item.labelNp}
            >
              {isActive && (
                <motion.div
                  layoutId="navActivePill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full brand-gradient shadow-md shadow-indigo-500/30 ring-1 ring-white/20"
                >
                  <div className="absolute inset-0 rounded-full opacity-60 blur-sm brand-gradient" />
                </motion.div>
              )}
              <span className={isActive ? 'drop-shadow' : ''}>{item.icon}</span>
              <span className={`font-display text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-opacity ${isActive ? 'inline opacity-100' : 'hidden sm:inline opacity-70'}`}>
                {language === 'en' ? item.labelEn : item.labelNp}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
