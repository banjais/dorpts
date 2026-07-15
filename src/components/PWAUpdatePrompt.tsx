import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Check, RotateCcw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLanguage } from '../context/LanguageContext';
import { APP_TITLES } from '../constants/appTitles';

const BUILD_VERSION = `v${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const DISMISSED_KEY = 'pwa-update-dismissed';

export const PWAUpdatePrompt: React.FC = () => {
  const { language } = useLanguage();
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [displayedNeedRefresh, setDisplayedNeedRefresh] = useState(false);
  const hasCheckedRef = useRef(false);

  const showUpdate = (needRefresh || displayedNeedRefresh) && !dismissed;
  const isActive = showUpdate || syncStatus !== 'idle';

  useEffect(() => {
    if (needRefresh && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      setDisplayedNeedRefresh(true);
    }
  }, [needRefresh]);

  useEffect(() => {
    if (sessionStorage.getItem('pwa-just-updated')) {
      sessionStorage.removeItem('pwa-just-updated');
      setSyncStatus('success');
      setProgress(100);
      setDisplayedNeedRefresh(false);
      setDismissed(false);
      sessionStorage.removeItem(DISMISSED_KEY);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (syncStatus === 'syncing') {
      setProgress(0);
      const start = Date.now();
      const duration = 1500;
      const tick = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(85, (elapsed / duration) * 85);
        setProgress(p);
        if (elapsed < duration) {
          requestAnimationFrame(tick);
        }
      };
      const raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [syncStatus]);

  const handleReload = async () => {
    setSyncStatus('syncing');
    try {
      await updateServiceWorker(true);
      setProgress(100);
      setSyncStatus('success');
      sessionStorage.setItem('pwa-just-updated', '1');
      setTimeout(() => window.location.reload(), 1800);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleSyncOnly = async () => {
    if (!isOnline) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return;
    }
    setSyncStatus('syncing');
    try {
      await updateServiceWorker(false);
      setProgress(100);
      setSyncStatus('success');
      sessionStorage.setItem('pwa-just-updated', '1');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDismiss = () => {
    if (syncStatus === 'success' || syncStatus === 'error') {
      setSyncStatus('idle');
    } else {
      setDismissed(true);
      sessionStorage.setItem(DISMISSED_KEY, 'true');
      window.dispatchEvent(new CustomEvent('pwa-banner-dismissed'));
    }
  };

  if (!isActive) return null;

  const isSuccess = syncStatus === 'success';
  const isError = syncStatus === 'error';
  const isSyncing = syncStatus === 'syncing';

  const titleEn = isSuccess
    ? "You're up to date"
    : isError
      ? 'Sync failed'
      : offlineReady
        ? 'Offline ready'
        : 'Update available';

  const titleNp = isSuccess
    ? 'तपाईं अद्यावधिक हुनुहुन्छ'
    : isError
      ? 'Sync असफल भयो'
      : offlineReady
        ? 'अफलाइन तयार छ'
        : 'अपडेट उपलब्ध छ';

  const descEn = isSuccess
    ? 'Latest version applied'
    : isError
      ? 'Please try again'
      : isSyncing
        ? 'Downloading update...'
        : offlineReady
          ? 'You can use this app offline'
          : 'A new version is ready';

  const descNp = isSuccess
    ? 'नयाँ संस्करण लागू भयो'
    : isError
      ? 'पुनः प्रयास गर्नुहोस्'
      : isSyncing
        ? 'अपडेट डाउनलोड गर्दै...'
        : offlineReady
          ? 'तपाईं यो एप अफलाइनमा प्रयोग गर्न सक्नुहुन्छ'
          : 'नयाँ संस्करण तयार छ';

  return (
    <AnimatePresence>
      {(showUpdate || isSyncing || isSuccess || isError) && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed left-0 right-16 md:right-24 bottom-4 md:bottom-6 z-[999] px-3 md:px-4"
        >
           <div className={`relative h-10 md:h-11 rounded-full pl-2 pr-3 shadow-2xl border flex items-center gap-2 overflow-hidden ${
             isSuccess || descEn.includes('applied')
               ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/30'
               : isError
                 ? 'bg-red-600 border-red-400 shadow-red-500/30'
                 : 'bg-[#0099DA] border-[#0074A6] shadow-[#0099DA]/20'
           }`}>
             {/* Dreamy slow left-to-right shimmer */}
             <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
               <motion.div
                 animate={{
                   x: ['-100%', '200%'],
                 }}
                 transition={{
                   duration: 3.5,
                   repeat: Infinity,
                   ease: 'easeInOut',
                 }}
                 className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm"
               />
             </div>
             <div className="absolute inset-0 rounded-full pointer-events-none">
               <motion.div
                 animate={{
                   opacity: [0.4, 0.8, 0.4],
                 }}
                 transition={{
                   duration: 2.5,
                   repeat: Infinity,
                   ease: 'easeInOut',
                 }}
                 className="absolute inset-0 bg-white/5 rounded-full"
               />
             </div>

             <div className="relative z-10 flex items-center gap-1 shrink-0">
              {isSuccess && (
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Check className="text-white w-3.5 h-3.5" strokeWidth={3} />
                </div>
              )}
              {isError && (
                <button
                  onClick={handleReload}
                  disabled={!isOnline}
                  className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all active:scale-90 disabled:opacity-50"
                  title={language === 'en' ? 'Retry' : 'पुनः प्रयास गर्नुहोस्'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              {showUpdate && (
                <button
                  onClick={handleReload}
                  className="h-7 px-3 bg-white text-[#0099DA] text-[10px] font-black uppercase tracking-tight rounded-lg shadow-sm hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  {language === 'en' ? 'Reload' : 'रिलोड'}
                </button>
              )}
              <button
                onClick={handleDismiss}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                  isError
                    ? 'bg-red-500/30 text-white shadow-lg shadow-red-500/50 hover:bg-red-500/50'
                    : 'text-white/70 hover:text-white hover:bg-white/15'
                }`}
                title={language === 'en' ? 'Dismiss' : 'बन्द गर्नुहोस्'}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="h-5 w-px bg-white/20 shrink-0" />

             <div className="relative z-10 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/pwa-192x192.png" alt={APP_TITLES.shortAppName[language]} className="w-5 h-5 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-black text-[11px] leading-tight truncate">
                  {language === 'en' ? titleEn : titleNp}
                </h3>
                <p className="text-white/80 text-[9px] font-semibold leading-snug truncate">
                  {language === 'en' ? descEn : descNp}
                </p>
              </div>
            </div>

            {isSyncing && (
              <div className="ml-auto w-16 h-1.5 bg-white/20 rounded-full overflow-hidden shrink-0">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear', duration: 0.1 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
