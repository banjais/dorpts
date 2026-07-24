import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, BarChart3, Users, MapPin, Bell, UserPlus,
  Download, Upload, Lock, FileText, Gauge, Activity,
  ChevronRight, Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'analytics', labelEn: 'User Analytics', labelNp: 'प्रयोगकर्ता विश्लेषण', icon: <BarChart3 size={16} /> },
  { id: 'collaboration', labelEn: 'Collaboration', labelNp: 'सहकार्य', icon: <Users size={16} /> },
  { id: 'geolocation', labelEn: 'Geolocation', labelNp: 'भौगोलिक स्थान', icon: <MapPin size={16} /> },
  { id: 'notifications', labelEn: 'Notifications', labelNp: 'सूचनाहरू', icon: <Bell size={16} /> },
  { id: 'bulk-roles', labelEn: 'Bulk Roles', labelNp: 'समूह भूमिका', icon: <UserPlus size={16} /> },
  { id: 'data-manager', labelEn: 'Data Manager', labelNp: 'डेटा व्यवस्थापक', icon: <Download size={16} /> },
  { id: 'security', labelEn: 'Security', labelNp: 'सुरक्षा', icon: <Lock size={16} /> },
  { id: 'logs', labelEn: 'System Logs', labelNp: 'सिस्टम लग', icon: <FileText size={16} /> },
  { id: 'performance', labelEn: 'Performance', labelNp: 'कार्यसम्पादन', icon: <Gauge size={16} /> },
  { id: 'system', labelEn: 'System Health', labelNp: 'प्रणाली स्वास्थ्य', icon: <Activity size={16} /> },
] as const;

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  isOpen,
  onClose,
  language,
  children,
  activeTab,
  onTabChange,
}) => {
  const activeItem = NAV_ITEMS.find(item => item.id === activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9000] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed top-0 left-0 bottom-0 z-[9001] w-[85%] max-w-[300px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-300">
                  <Shield size={18} />
                </div>
                <div className="leading-tight">
                  <p className="text-[0.75rem] font-black uppercase text-slate-800 dark:text-white">
                    {language === 'en' ? 'Super Admin' : 'सुपर एडमिन'}
                  </p>
                  <p className="text-[0.6rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'en' ? 'Control Panel' : 'नियन्त्रण प्यानल'}
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

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                   <button
                     key={item.id}
                     onClick={() => {
                       onTabChange(item.id);
                     }}
                     className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                       isActive
                         ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200'
                         : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                     }`}
                   >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] font-bold leading-tight truncate">
                        {language === 'en' ? item.labelEn : item.labelNp}
                      </span>
                    </span>
                    {isActive && (
                      <ChevronRight size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                  </button>
                );
              })}
            </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Content Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeItem ? (language === 'en' ? activeItem.labelEn : activeItem.labelNp) : ''}
          </h3>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {children}
        </div>
      </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
