import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const OfflineStatusBar: React.FC = () => {
  const { language } = useLanguage();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          className="fixed bottom-[88px] left-4 right-4 z-[5999] md:left-auto md:right-6 md:w-auto"
        >
          <div className="flex items-center justify-center gap-2 bg-slate-900/90 dark:bg-slate-100/90 backdrop-blur-xl text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 dark:border-slate-900/10">
            <WifiOff size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {language === 'en' ? 'Offline' : 'अफलाइन'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
