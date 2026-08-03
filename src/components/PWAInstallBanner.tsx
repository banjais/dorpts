import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { APP_TITLES } from '../constants/appTitles';

type InstallState = 'idle' | 'steps' | 'installed';

export const PWAInstallBanner: React.FC = () => {
  const { language } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const appLabel = language === 'en' ? APP_TITLES.appName.en : APP_TITLES.appName.ne;
  const shortLabel = APP_TITLES.shortAppName[language];

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setInstallState('installed');
        setTimeout(() => setShowBanner(false), 3000);
      } else {
        setShowBanner(true);
      }
    };
    mq.addEventListener('change', handler);
    if (mq.matches) setShowBanner(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mq.removeEventListener('change', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallState('installed');
        setTimeout(() => setShowBanner(false), 3000);
      }
      setDeferredPrompt(null);
    } else {
      setInstallState('steps');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setInstallState('idle');
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {installState === 'installed' ? (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed left-0 right-16 md:right-24 bottom-4 md:bottom-6 z-[999] px-3 md:px-4"
        >
          <div className="h-10 md:h-11 rounded-full pl-2 pr-3 bg-emerald-600 border border-emerald-400 shadow-2xl shadow-emerald-500/30 flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-white w-4 h-4" strokeWidth={2.5} />
              </div>
            </div>
            <div className="h-5 w-px bg-white/20 shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-black text-[11px] leading-tight">
                {language === 'en' ? 'Installed!' : 'इन्स्टल भयो!'}
              </p>
              <p className="text-emerald-100 text-[9px] font-semibold leading-snug">
                {language === 'en' ? `DORPTS is on your home screen` : `DORPTS होम स्क्रिनमा थपियो`}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed left-0 right-16 md:right-24 bottom-4 md:bottom-6 z-[999] px-3 md:px-4"
        >
          <div className="h-10 md:h-11 rounded-full pl-2 pr-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 shadow-2xl flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleInstallClick}
                className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-tight rounded-lg shadow-sm active:scale-95 transition-all whitespace-nowrap"
              >
                {installState === 'steps' && !deferredPrompt
                  ? (language === 'en' ? 'Steps' : 'चरण')
                  : (language === 'en' ? 'Install' : 'इन्स्टल')}
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/pwa-192x192.png" alt={shortLabel} className="w-5 h-5 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-900 dark:text-white font-black text-[11px] leading-tight truncate">
                  {isOffline
                    ? (language === 'en' ? "You're Offline" : "तपाईं अफलाइन हुनुहुन्छ")
                    : (language === 'en' ? `Install ${appLabel}` : `${appLabel} इन्स्टल गर्नुहोस्`)}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold leading-snug truncate">
                  {isOffline
                    ? (language === 'en' ? 'Add to home screen for offline access' : 'अफलाइन पहुँचका लागि थप्नुहोस्')
                    : (language === 'en' ? 'Add to home screen for instant access' : 'तुरuent पहुँचका लागि थप्नुहोस्')}
                </p>
              </div>
            </div>
          </div>

          {installState === 'steps' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mt-2 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200/60 dark:border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  {language === 'en' ? 'How to install' : 'कसरी इन्स्टल गर्ने'}
                </span>
              </div>
              <ol className="space-y-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-snug">
                {isIOS ? (
                  <>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                      <span>{language === 'en' ? 'Tap the Share button (square with up-arrow) in Safari' : 'सफारीमा सेयर बटन (तीर भएको वर्ग) मा ट्याप गर्नुहोस्'}</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                        <span>{language === 'en' ? "Choose \"Add to Home Screen\"" : "'Add to Home Screen' छान्नुहोस्"}</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">3</span>
                      <span>{language === 'en' ? 'Tap Add to complete' : 'Add मा ट्याप गरेर पूरा गर्नुहोस्'}</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                      <span>{language === 'en' ? 'Open your browser menu (⋮ or ⋯)' : 'आफ्नो ब्राउजर मेनु (⋮ वा ⋯) खोल्नुहोस्'}</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                      <span>{language === 'en' ? "Select 'Install App' or 'Add to Home Screen'" : "'Install App' वा 'Add to Home Screen' चयन गर्नुहोस्"}</span>
                    </li>
                  </>
                )}
              </ol>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
