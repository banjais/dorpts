import React, { useState, useEffect, useCallback } from 'react';
import { Copy, X, Facebook, MessageCircle, Linkedin, Mail, Instagram, Check, ChevronUp, FileText, Share2, Sparkles, ChevronDown, ChevronRight, MessageSquare, RefreshCw, Menu, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { APP_TITLES, APP_VERSION } from '../constants/appTitles';

interface FooterProps {
  onOpenReportBuilder?: () => void;
  onOpenAI?: () => void;
  onOpenMessaging?: () => void;
  isScrolled?: boolean;
  fiscalYear?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  isSyncing?: boolean;
  onManualSync?: (suppressToast?: boolean) => void;
  onOpenDrawer?: () => void;
  onGoHome?: () => void;
  pendingWrites?: Array<{ id: string; name: string; nameEn?: string }>;
  hasPendingWrites?: boolean;
  isAdmin?: boolean;
  needRefresh?: boolean;
  onUpdateClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenReportBuilder, 
  onOpenAI,
  onOpenMessaging,
  isScrolled,
  fiscalYear,
  isExpanded = false,
  onExpandChange,
  isSyncing = false,
  onManualSync,
  onOpenDrawer,
  onGoHome,
  pendingWrites = [],
  hasPendingWrites = false,
  isAdmin = false,
  needRefresh = false,
  onUpdateClick,
}) => {
  const { language, t } = useLanguage();
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isQrHovered, setIsQrHovered] = useState(false);
  const currentUrl = window.location.href;
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const prevSyncingRef = React.useRef(isSyncing);
  const [showLastSynced, setShowLastSynced] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const didLongPressRef = React.useRef(false);
  
  const closeAllPanels = useCallback(() => {
    setIsQrHovered(false);
    setShowQr(false);
    setShowSyncDropdown(false);
  }, []);

  const closeMenuPopups = useCallback(() => {
    setIsQrHovered(false);
    setShowSyncDropdown(false);
  }, []);
  
  const shouldExpand = isExpanded || isHovered || isTouched;
  
  const updateMinutesAgo = () => {
    try {
      const timestamp = localStorage.getItem('dor_last_sync_timestamp');
      if (timestamp) {
        const diffMs = Date.now() - new Date(timestamp).getTime();
        setMinutesAgo(Math.max(0, Math.floor(diffMs / 60000)));
      }
    } catch (_) {
      // suppress
    }
  };

  useEffect(() => {
    updateMinutesAgo();
    const timer = setTimeout(() => setShowLastSynced(true), 500);
    const interval = setInterval(updateMinutesAgo, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isSyncing && prevSyncingRef.current) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
      setShowLastSynced(true);
      setTimeout(() => setShowLastSynced(false), 5000);
      setTimeout(updateMinutesAgo, 500);
      setTimeout(updateMinutesAgo, 1500);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  
  const shareText = language === 'en' 
    ? `Check out ${APP_TITLES.shortAppName.en}!` 
    : `${APP_TITLES.shortAppName.ne} हेर्नुहोस्!`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const shareLinks = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + currentUrl)}` },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}` },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}` },
    { name: 'Gmail', icon: Mail, color: 'text-red-500', url: `mailto:?subject=${encodeURIComponent(language === 'en' ? `${APP_TITLES.appName.en} Progress Tracking` : `${APP_TITLES.appName.ne} प्रगति ट्र्याकिङ`)}&body=${encodeURIComponent(shareText + " " + currentUrl)}` },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-600', url: `https://www.instagram.com/` },
  ];

  const handleSyncClick = async () => {
    await handleQuickSync();
  };

  const handleSyncLongPress = () => {
    didLongPressRef.current = true;
    closeMenuPopups();
    setShowSyncDropdown(prev => !prev);
  };

  const handleSyncPressStart = () => {
    didLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      handleSyncLongPress();
    }, 500);
  };

  const handleSyncPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleQuickSync = async () => {
    setShowSyncDropdown(false);
    await onManualSync?.(true);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
    setShowLastSynced(true);
    setTimeout(() => setShowLastSynced(false), 3000);
    setTimeout(updateMinutesAgo, 500);
  };

  const handleFullRefresh = async () => {
    setShowSyncDropdown(false);
    try {
      await caches?.delete?.('dorpts-v1');
    } catch (_) {}
    try {
      if (typeof indexedDB !== 'undefined') {
        const dbNames = await indexedDB.databases();
        const names = dbNames.map(db => db.name);
        for (const name of names) {
          try { indexedDB.deleteDatabase(name); } catch (_) {}
        }
      }
    } catch (_) {}
    const keysToRemove = [
      'dor_indicators_cache',
      'dor_metadata_cache', 
      'dor_last_sync_timestamp',
      'dor_last_seen_update',
      'dor_chart_type_pref',
      'syncInterval',
      'searchHistory',
      'dor_search_history',
      'last_search_query',
      'dor_app_version',
    ];
    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      } catch (_) {}
    }
    await onManualSync?.();
    onGoHome?.();
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const menuItems = [
    { id: 'btn-reports', icon: FileText, action: onOpenReportBuilder || (() => { try { window.print(); } catch(e) { console.error(e); } }) },
    { id: 'btn-install', icon: Download, action: handleInstallClick },
    ...(isAdmin ? [{ id: 'btn-messaging', icon: MessageSquare, action: () => onOpenMessaging?.() }] : []),
    { id: 'btn-share', icon: Share2, action: () => setShowQr(true) },
    { 
      id: 'btn-sync', 
      icon: RefreshCw, 
      action: handleSyncClick 
    },
  ];

  const actionItems = [
    {
      id: 'btn-ai',
      icon: Sparkles,
      label: 'AI',
      action: onOpenAI || (() => {}),
      highlight: true
    },
    {
      id: 'btn-menu',
      icon: Menu,
      label: language === 'en' ? 'Open Menu' : 'मेनु खोल्नुहोस्',
      action: onOpenDrawer || (() => {}),
      highlight: false
    }
  ];

  return (
    <>
         <footer 
           id="app-footer"
           onMouseEnter={() => { setIsHovered(true); onExpandChange?.(true); }}
           onMouseLeave={() => { setIsHovered(false); onExpandChange?.(false); }}
           onTouchStart={() => { setIsTouched(true); onExpandChange?.(true); }}
           onTouchEnd={() => { setIsTouched(false); onExpandChange?.(false); }}
           onClick={(e) => { e.stopPropagation(); onExpandChange?.(!shouldExpand); }}
          className={`fixed bottom-0 left-0 w-full z-[850] transition-all duration-500 ease-out cursor-pointer ${
            shouldExpand
              ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t-2 border-indigo-500/40 dark:border-indigo-400/30 shadow-[0_-4px_32px_rgba(0,0,0,0.08)] py-10 sm:py-14'
              : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-300/60 dark:border-slate-700/60 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] py-3 sm:py-3.5'
          }`}
        >
        <motion.div 
          className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center relative min-h-[28px]"
          animate={{ 
            height: shouldExpand ? 'auto' : 'auto',
            opacity: shouldExpand ? 1 : 0.9,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Integrated +FAB button inside the bar at right - perfectly vertically centered */}
          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center">
             <motion.button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 onExpandChange?.(!shouldExpand);
               }}
               onMouseEnter={() => {
                 setIsHovered(true);
                 onExpandChange?.(true);
               }}
               whileHover={{ scale: 1.08 }}
               whileTap={{ scale: 0.92 }}
               className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center cursor-pointer border border-indigo-400/30 hover:shadow-indigo-500/50 transition-all relative"
               title={shouldExpand ? (language === 'en' ? 'Close Portal' : 'पोर्टल बन्द गर्नुहोस्') : (language === 'en' ? 'Expand Portal' : 'द्रुत कार्यहरू')}
             >
               <motion.span
                 className="flex items-center justify-center"
                 animate={{ rotate: shouldExpand ? 180 : 0 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
               >
                 <ChevronDown size={18} className="sm:w-5 sm:h-5" />
               </motion.span>
               {!shouldExpand && (
                 <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                 </span>
               )}
             </motion.button>
          </div>
          {shouldExpand && (
            <>
              <div className="flex flex-col items-center mb-3 text-center">
                <div className="w-10 h-1 bg-[#dc2626] mx-auto rounded-full"></div>
              </div>

               <div className="w-full flex flex-col items-center gap-4 sm:gap-6">
                 <div className="w-full flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-2 pb-4">
                    {[...menuItems, ...actionItems].map((item) => (
                      <div key={item.id} className="relative shrink-0">
                        {item.id === 'btn-share' && (
                          <AnimatePresence>
                            {isQrHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col items-center gap-2 pointer-events-none"
                              >
                                <div className="p-2 bg-white rounded-xl border border-slate-100">
                                  <QRCodeCanvas value={currentUrl} size={110} />
                                </div>
                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                                  {t('scanToOpen') || 'Scan to Open'}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                           )}
                             <button
                            id={item.id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (didLongPressRef.current) {
                                didLongPressRef.current = false;
                                return;
                              }
                              closeAllPanels();
                              if (item.id === 'btn-sync') {
                                handleSyncClick();
                              } else {
                                item.action();
                              }
                            }}
                            onMouseDown={(e) => { if (item.id === 'btn-sync') { e.stopPropagation(); handleSyncPressStart(); } }}
                            onMouseUp={(e) => { if (item.id === 'btn-sync') { e.stopPropagation(); handleSyncPressEnd(); } }}
                            onTouchStart={(e) => { if (item.id === 'btn-sync') { e.stopPropagation(); handleSyncPressStart(); } }}
                            onTouchEnd={(e) => { if (item.id === 'btn-sync') { e.stopPropagation(); handleSyncPressEnd(); } }}
                             onMouseEnter={() => { 
                               closeMenuPopups();
                               if (item.id === 'btn-share') setIsQrHovered(true); 
                             }}
                             onMouseLeave={() => { 
                               if (item.id === 'btn-sync') handleSyncPressEnd();
                             }}
                             className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer border relative ${
                               item.id === 'btn-menu'
                                 ? 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-indigo-300 dark:hover:border-indigo-700'
                                : item.id === 'btn-ai'
                                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-indigo-500/50 shadow-md shadow-indigo-600/30 hover:scale-105'
                                  : item.id === 'btn-install'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:border-indigo-500/50'
                                     : item.id === 'btn-messaging'
                                       ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:border-indigo-500/50'
                                       : item.id === 'btn-sync'
                                          ? hasPendingWrites
                                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:shadow-[0_0_12px_rgba(79,70,229,0.15)]'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50'
                             }`}
                             title={
                               item.id === 'btn-reports'
                                 ? (language === 'en' ? 'Reports' : 'रिपोर्टहरू')
                                 : item.id === 'btn-menu'
                                   ? (language === 'en' ? 'Open Menu' : 'मेनु खोल्नुहोस्')
                                   : item.id === 'btn-ai'
                                     ? (language === 'en' ? 'AI Assistant' : 'एआई सहायक')
                                     : item.id === 'btn-sync'
                                       ? (language === 'en' ? 'Sync' : 'सिङ्क')
                                       : item.id === 'btn-install'
                                         ? (language === 'en' ? 'Install App' : 'अप्लिकेसन इन्स्टल गर्नुहोस्')
                                          : item.id === 'btn-messaging'
                                            ? (language === 'en' ? 'Messages' : 'सन्देशहरू')
                                            : ''
                             }
                         >
                            {item.id === 'btn-ai' && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                              </span>
                            )}
                            {item.id === 'btn-sync' && hasPendingWrites && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-black text-white items-center justify-center shadow-md border border-white dark:border-slate-900">
                                  {pendingWrites.length}
                                </span>
                              </span>
                            )}
                              <item.icon size={18} strokeWidth={2.5} className={`${item.id === 'btn-ai' ? 'text-white' : item.id === 'btn-install' ? 'text-indigo-700 dark:text-indigo-300' : item.id === 'btn-messaging' ? 'text-indigo-700 dark:text-indigo-300' : item.id === 'btn-sync' && hasPendingWrites ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'} sm:size-[20px] transition-colors shrink-0 ${item.id === 'btn-sync' && isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                          {item.id === 'btn-sync' && showSyncDropdown && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                              >
                                <div className="p-2 space-y-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleQuickSync(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors"
                                  >
                                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                    {language === 'en' ? 'Sync Now' : 'अहिले सिङ्क गर्नुहोस्'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleFullRefresh(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                                  >
                                    <X size={14} />
                                    {language === 'en' ? 'Full Refresh' : 'पूरा रिफ्रेस'}
                                  </button>
                                </div>
                                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {language === 'en' ? 'Last synced' : 'अन्तिम सिङ्क'}
                                    {minutesAgo !== null ? `: ${minutesAgo === 0 ? (language === 'en' ? 'just now' : 'अहिले') : `${language === 'en' ? `${minutesAgo}m ago` : `${minutesAgo} मिनेट पहिले`}`}` : ''}
                                  </p>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          )}
                       </div>
                     ))}
                 </div>
               </div>

             <div className="flex flex-col items-center gap-2 mt-4">
                 <div className="flex items-center gap-3">
                   <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700"></div>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                     {APP_TITLES.copyright[language]}
                   </p>
                   <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700"></div>
                 </div>
                 <div className="flex items-center justify-center gap-3">
                   <p className="text-[9px] font-mono tracking-[0.2em] text-slate-400 dark:text-slate-600 uppercase font-medium">
                     v{APP_VERSION}
                   </p>
                   <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                   {needRefresh && (
                     <button
                       onClick={(e) => { e.stopPropagation(); onUpdateClick?.(); }}
                       className="animate-pulse text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
                     >
                       {language === 'en' ? 'Update' : 'अपडेट'}
                     </button>
                   )}
                   {minutesAgo !== null && (
                   <p className="text-[9px] font-mono tracking-[0.2em] text-indigo-500/70 dark:text-indigo-400/70 uppercase font-medium truncate">
                     {language === 'en' ? `Last synced: ${minutesAgo}m ago` : `पछिल्लो पटक सिंक: ${minutesAgo} मिनेट अघि`}
                   </p>
                 )}
                 </div>
                  {shouldExpand && (
                    <div className="w-full max-w-md mt-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40 rounded-xl p-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                       {language === 'en' ? 'How to install' : 'कसरी इन्स्टल गर्ने'}
                     </span>
                     <ol className="mt-1.5 space-y-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-snug">
                       {/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream ? (
                         <>
                           <li className="flex gap-2"><span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black shrink-0">1</span><span>{language === 'en' ? 'Tap Share button in Safari' : 'सफारीमा सेयर बटन मा ट्याप गर्नुहोस्'}</span></li>
                           <li className="flex gap-2"><span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black shrink-0">2</span><span>{language === 'en' ? 'Choose "Add to Home Screen"' : '"Add to Home Screen" छान्नुहोस्'}</span></li>
                           <li className="flex gap-2"><span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black shrink-0">3</span><span>{language === 'en' ? 'Tap Add to complete' : 'Add मा ट्याप गरेर पूरा गर्नुहोस्'}</span></li>
                         </>
                       ) : (
                         <>
                           <li className="flex gap-2"><span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black shrink-0">1</span><span>{language === 'en' ? 'Open browser menu (⋮ or ⋯)' : 'ब्राउजर मेनु (⋮ वा ⋯) खोल्नुहोस्'}</span></li>
                           <li className="flex gap-2"><span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[8px] font-black shrink-0">2</span><span>{language === 'en' ? 'Select "Install App" or "Add to Home Screen"' : '"Install App" वा "Add to Home Screen" चयन गर्नुहोस्'}</span></li>
                         </>
                       )}
                     </ol>
                   </div>
                 )}
              </div>
             </>
           )}

           {!shouldExpand && (
            <div className="flex items-center justify-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></div>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30"
                >
                  <RefreshCw size={10} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {language === 'en' ? 'Syncing' : 'सिंक'}
                  </span>
                </motion.div>
              )}
              {syncSuccess && !isSyncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30"
                >
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {language === 'en' ? 'Updated' : 'अपडेट भयो'}
                  </span>
                </motion.div>
              )}
              {needRefresh && (
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onUpdateClick?.(); }}
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.05, 0.95]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 cursor-pointer"
                >
                  <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    {language === 'en' ? 'Update' : 'अपडेट'}
                  </span>
                </motion.button>
              )}
              {minutesAgo !== null && !isSyncing && !syncSuccess && showLastSynced && (
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {language === 'en' ? `Synced ${minutesAgo}m ago` : `सिंक: ${minutesAgo} मिनेट अघि`}
                </span>
              )}
              <motion.span
                animate={{ 
                  opacity: [0.4, 1, 0.4],
                  y: [0, 2, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-slate-400 dark:text-slate-500 text-xs font-bold"
              >
                <ChevronUp size={14} />
              </motion.span>
            </div>
          )}
        </motion.div>
      </footer>

      <AnimatePresence>
        {showQr && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
             className="fixed inset-0 flex items-center justify-center bg-slate-950/80 dark:bg-black/70 backdrop-blur-md z-[100] p-6"
            onClick={() => setShowQr(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-[2rem] flex flex-col items-center gap-6 shadow-2xl relative max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <QRCodeCanvas value={currentUrl} size={160} />
              </div>
              <div className="text-center space-y-2 w-full">
                <h3 className="font-black text-slate-900 text-lg">
                  {t('instantAccess')}
                </h3>
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg text-[10px] font-mono text-slate-600 overflow-hidden">
                  <span className="truncate flex-1">{currentUrl}</span>
                  <button onClick={handleCopy} className="p-1.5 bg-white rounded-md shadow-sm hover:text-indigo-600 cursor-pointer">
                    {copied ? <Check size={12} className="text-emerald-500 font-bold" /> : <Copy size={12} />}
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] font-bold text-emerald-500 tracking-wider">
                    {language === 'en' ? 'Link Copied!' : 'लिङ्क कपि भयो!'}
                  </p>
                )}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {t('shareTo')}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {shareLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors ${social.color}`}
                        title={social.name}
                      >
                        <social.icon size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowQr(false)} 
                className="absolute -top-4 -right-4 bg-[#dc2626] text-white p-2.5 rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

