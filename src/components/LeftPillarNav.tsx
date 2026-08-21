import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, TrendingUp, Activity, Building2, Megaphone, MessageSquare, CalendarDays, Route } from 'lucide-react';
import type { MainView } from '../types';

export const NAV_ITEMS = [
  { id: 'dashboard' as MainView, labelEn: 'HOME', labelNp: 'गृहपृष्ठ', icon: <LayoutDashboard size={18} /> },
  { id: 'highways-info' as MainView, labelEn: 'HIGHWAYS', labelNp: 'राजमार्ग', icon: <Route size={18} /> },
  { id: 'trends' as MainView, labelEn: 'TRENDS', labelNp: 'प्रवृत्ति', icon: <TrendingUp size={18} /> },
  { id: 'heatmap' as MainView, labelEn: 'HEATMAP', labelNp: 'हिटम्याप', icon: <Activity size={18} /> },
  { id: 'institutional' as MainView, labelEn: 'INSTITUTIONAL', labelNp: 'संस्थागत', icon: <Building2 size={18} /> },
  { id: 'announcements' as MainView, labelEn: 'ANNOUNCEMENTS', labelNp: 'घोषणाहरू', icon: <Megaphone size={18} /> },
  { id: 'messaging' as MainView, labelEn: 'MESSAGES', labelNp: 'सन्देशहरू', icon: <MessageSquare size={18} /> },
  { id: 'calendar' as MainView, labelEn: 'CALENDAR', labelNp: 'क्यालेन्डर', icon: <CalendarDays size={18} /> },
  { id: 'feedbacks' as MainView, labelEn: 'FEEDBACKS', labelNp: 'प्रतिक्रियाहरू', icon: <MessageSquare size={18} /> },
];

type PillarColor = {
  bg: string;
  activeBg: string;
  glow: string;
  border: string;
};

const SECTION_COLORS: Record<MainView, PillarColor> = {
  dashboard: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-indigo-600 dark:bg-indigo-500',
    glow: 'shadow-indigo-500/40',
    border: 'border-indigo-200 dark:border-indigo-700/40',
  },
  'highways-info': {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-indigo-600 dark:bg-indigo-500',
    glow: 'shadow-indigo-500/40',
    border: 'border-indigo-200 dark:border-indigo-700/40',
  },
  trends: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-emerald-600 dark:bg-emerald-500',
    glow: 'shadow-emerald-500/40',
    border: 'border-emerald-200 dark:border-emerald-700/40',
  },
  heatmap: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-amber-600 dark:bg-amber-500',
    glow: 'shadow-amber-500/40',
    border: 'border-amber-200 dark:border-amber-700/40',
  },
  institutional: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-violet-600 dark:bg-violet-500',
    glow: 'shadow-violet-500/40',
    border: 'border-violet-200 dark:border-violet-700/40',
  },
  insights: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/80',
    activeBg: 'bg-indigo-600 dark:bg-indigo-500',
    glow: 'shadow-indigo-500/40',
    border: 'border-indigo-200 dark:border-indigo-700/40',
  },
   superadmin: {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-rose-600 dark:bg-rose-500',
     glow: 'shadow-rose-500/40',
     border: 'border-rose-200 dark:border-rose-700/40',
   },
    admin: {
      bg: 'bg-slate-50/80 dark:bg-slate-900/80',
      activeBg: 'bg-indigo-600 dark:bg-indigo-500',
      glow: 'shadow-indigo-500/40',
      border: 'border-indigo-200 dark:border-indigo-700/40',
    },
    announcements: {
      bg: 'bg-slate-50/80 dark:bg-slate-900/80',
      activeBg: 'bg-amber-600 dark:bg-amber-500',
      glow: 'shadow-amber-500/40',
      border: 'border-amber-200 dark:border-amber-700/40',
    },
    viewer: {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-emerald-600 dark:bg-emerald-500',
     glow: 'shadow-emerald-500/40',
     border: 'border-emerald-200 dark:border-emerald-700/40',
   },
   messaging: {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-indigo-600 dark:bg-indigo-500',
     glow: 'shadow-indigo-500/40',
     border: 'border-indigo-200 dark:border-indigo-700/40',
   },
   calendar: {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-amber-600 dark:bg-amber-500',
     glow: 'shadow-amber-500/40',
     border: 'border-amber-200 dark:border-amber-700/40',
   },
   feedbacks: {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-pink-600 dark:bg-pink-500',
     glow: 'shadow-pink-500/40',
     border: 'border-pink-200 dark:border-pink-700/40',
   },
   'detailed-gallery': {
     bg: 'bg-slate-50/80 dark:bg-slate-900/80',
     activeBg: 'bg-slate-600 dark:bg-slate-500',
     glow: 'shadow-slate-500/40',
     border: 'border-slate-200 dark:border-slate-700/40',
   },
 };

interface LeftPillarNavProps {
  activeView: MainView;
  onViewChange: (view: MainView) => void;
  isAdmin?: boolean;
}

export const LeftPillarNav: React.FC<LeftPillarNavProps> = ({ activeView, onViewChange, isAdmin = false }) => {
  const [hovered, setHovered] = useState<MainView | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.id === 'messaging') return isAdmin;
    if (item.id === 'feedbacks') return isAdmin;
    return true;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveView = hovered || activeView;
  const colors = SECTION_COLORS[effectiveView] || SECTION_COLORS.dashboard;

  if (isMobile) {
    return (
      <nav className="fixed bottom-4 left-4 right-4 z-[6000] md:hidden">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg p-1">
          <div className="flex items-center justify-around">
            {visibleNavItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative px-3 py-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-0.5 min-w-[48px] cursor-pointer ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="leftPillActive"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl brand-gradient shadow-md"
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider relative z-10">
                    {item.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed right-3 top-1/2 -translate-y-1/2 z-[6000] hidden md:flex">
      <motion.div
        animate={{
          backgroundColor: 'rgba(255,255,255,0.92)',
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className={`relative flex flex-col items-center gap-1 p-1.5 rounded-2xl border backdrop-blur-xl shadow-xl ${colors.glow} ${colors.border}`}
      >
        <motion.div
          layoutId="rightPillarGlow"
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className={`absolute inset-0 rounded-2xl opacity-15 blur-md ${colors.activeBg}`}
        />

        <motion.div
          className="absolute -right-[3px] top-0 bottom-0 w-[3px] rounded-full bg-indigo-600"
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className={`relative w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center group cursor-pointer ${
                isActive
                  ? `${colors.activeBg} text-white shadow-lg scale-110`
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={item.labelEn}
            >
              {isActive && (
                <motion.div
                  layoutId="rightPillActive"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-xl brand-gradient shadow-lg"
                />
              )}
              <span className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>

              <span className="absolute right-full mr-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {item.labelEn}
                <span className="block text-[8px] font-medium text-slate-300 normal-case">
                  {item.labelNp}
                </span>
              </span>
            </button>
          );
        })}
      </motion.div>
    </nav>
  );
};
