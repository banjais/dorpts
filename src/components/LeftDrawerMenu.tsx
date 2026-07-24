import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutDashboard,
  Image,
  BarChart3,
  TrendingUp,
  Activity,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  Info,
  Crown,
} from 'lucide-react';
import type { MainView } from '../types';
import { useAuth } from '../context/AuthContext';

interface LeftDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
  activeView: MainView;
  onNavigate: (view: MainView) => void;
  onOpenVisualInsights: () => void;
  onOpenAbout?: () => void;
  onOpenLogin?: () => void;
  onExpandFooter?: () => void;
  onOpenDetailedGallery?: () => void;
  isSuperadmin?: boolean;
}

export const LeftDrawerMenu: React.FC<LeftDrawerMenuProps> = ({
  isOpen,
  onClose,
  language,
  activeView,
  onNavigate,
  onOpenVisualInsights,
  onOpenAbout,
  onOpenLogin,
  onExpandFooter,
  onOpenDetailedGallery,
  isSuperadmin = false,
}) => {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();

  const items: {
    id: string;
    icon: React.ReactNode;
    labelEn: string;
    labelNp: string;
    onClick: () => void;
    active?: boolean;
    soon?: boolean;
  }[] = [
    {
      id: 'overview',
      icon: <LayoutDashboard size={18} />,
      labelEn: 'Overview',
      labelNp: 'अवलोकन',
      onClick: () => onNavigate('dashboard'),
      active: activeView === 'dashboard',
    },
    ...(isSuperadmin ? [{
      id: 'superadmin',
      icon: <Crown size={18} />,
      labelEn: 'Super Admin',
      labelNp: 'सुपर एडमिन',
      onClick: () => onNavigate('superadmin'),
      active: false,
    }] : []),
    {
      id: 'detailed-gallery',
      icon: <Image size={18} />,
      labelEn: 'Detailed Gallery',
      labelNp: 'विस्तृत ग्यालरी',
      onClick: () => {
        onOpenDetailedGallery?.();
        onClose();
      },
      active: activeView === 'dashboard',
    },
    {
      id: 'visual-insights',
      icon: <BarChart3 size={18} />,
      labelEn: 'Visual Insights',
      labelNp: 'दृश्यात्मक अन्तर्दृष्टि',
      onClick: onOpenVisualInsights,
      active: activeView === 'insights',
    },
    {
      id: 'trends',
      icon: <TrendingUp size={18} />,
      labelEn: 'Trends',
      labelNp: 'प्रवृत्ति',
      onClick: () => onNavigate('trends'),
      active: activeView === 'trends',
    },
    {
      id: 'heatmap',
      icon: <Activity size={18} />,
      labelEn: 'Heatmap',
      labelNp: 'हिटम्याप',
      onClick: () => onNavigate('heatmap'),
      active: activeView === 'heatmap',
    },
    {
      id: 'action-portal',
      icon: <ShieldCheck size={18} />,
      labelEn: 'Action Portal',
      labelNp: 'कार्य पोर्टल',
      onClick: () => {
        onExpandFooter?.();
        onClose();
      },
    },
    {
      id: 'about',
      icon: <Info size={18} />,
      labelEn: 'System Info',
      labelNp: 'सिस्टम सूचना',
      onClick: () => {
        onOpenAbout?.();
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[8000] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed top-0 left-0 bottom-0 z-[8001] w-[78%] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-sm">
                  <img src="/GovtLogo.svg" alt="Government of Nepal Logo" className="w-[66%] h-[66%] object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-[0.8rem] font-black uppercase text-slate-800 dark:text-white">DORPTS</p>
                  <p className="text-[0.52rem] font-extrabold uppercase tracking-tight text-[#0099DA] dark:text-[#00ADF7]">
                    {language === 'en' ? 'Progress Tracker' : 'प्रगति ट्र्याकर'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-left group ${
                    item.active
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      item.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold leading-tight truncate">
                      {language === 'en' ? item.labelEn : item.labelNp}
                    </span>
                  </span>
                  {item.soon && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      {language === 'en' ? 'Soon' : 'चाँडो'}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {user ? (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    title={language === 'en' ? 'Sign out' : 'साइन आउट'}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => { onClose(); onOpenLogin?.(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <LogIn size={14} />
                  {language === 'en' ? 'Sign In' : 'साइन इन'}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
