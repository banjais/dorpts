import React, { useState, useEffect } from 'react';
import { Copy, X, Facebook, MessageCircle, Linkedin, Mail, Instagram, Check, HelpCircle, ChevronUp, FileText, Share2, Sparkles, ChevronDown, ChevronRight, MessageSquare, RefreshCw, Menu } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { APP_TITLES } from '../constants/appTitles';

interface FooterProps {
  onOpenReportBuilder?: () => void;
  onOpenHelp?: () => void;
  onOpenFeedback?: () => void;
  onOpenAI?: () => void;
  isScrolled?: boolean;
  fiscalYear?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  isSyncing?: boolean;
  onManualSync?: () => void;
  onOpenDrawer?: () => void;
  onGoHome?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenReportBuilder, 
  onOpenHelp,
  onOpenFeedback,
  onOpenAI,
  isScrolled,
  fiscalYear,
  isExpanded = false,
  onExpandChange,
  isSyncing = false,
  onManualSync,
  onOpenDrawer,
  onGoHome,
}) => {
  const { language, t } = useLanguage();
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isQrHovered, setIsQrHovered] = useState(false);
  const currentUrl = window.location.href;
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const prevSyncingRef = React.useRef(isSyncing);
  
  const shouldExpand = isExpanded || isHovered;
  
  useEffect(() => {
    if (!isSyncing && prevSyncingRef.current) {
      setSyncSuccess(true);
      const timer = setTimeout(() => setSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing]);
  
  useEffect(() => {
    const updateMinutesAgo = () => {
      const timestamp = localStorage.getItem('dor_last_sync_timestamp');
      if (timestamp) {
        const diffMs = Date.now() - new Date(timestamp).getTime();
        setMinutesAgo(Math.max(0, Math.floor(diffMs / 60000)));
      }
    };
    
    updateMinutesAgo();
    const interval = setInterval(updateMinutesAgo, 60000);
    return () => clearInterval(interval);
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
    { name: 'Gmail', icon: Mail, color: 'text-red-500', url: `mailto:?subject=${encodeURIComponent(language === 'en' ? "DOR Progress Tracking" : "सडक विभाग प्रगति ट्र्याकिङ")}&body=${encodeURIComponent(shareText + " " + currentUrl)}` },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-600', url: `https://www.instagram.com/` },
  ];

  const handleFullRefresh = async () => {
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
    try {
      localStorage.clear();
    } catch (_) {}
    try {
      sessionStorage.clear();
    } catch (_) {}
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      } catch (_) {}
    }
    await onManualSync?.();
    onGoHome?.();
  };

  const menuItems = [
    { 
      id: 'btn-reports', 
      icon: FileText, 
      action: onOpenReportBuilder || (() => { try { window.print(); } catch(e) { console.error(e); } }) 
    },
    { id: 'btn-share', icon: Share2, action: () => setShowQr(true) },
    { id: 'btn-help', icon: HelpCircle, action: onOpenHelp || (() => {}) },
    { id: 'btn-feedback', icon: MessageSquare, action: onOpenFeedback || (() => {}) },
    { 
      id: 'btn-sync', 
      icon: RefreshCw, 
      action: handleFullRefresh 
    },
  ];

  const actionItems = [
    {
      id: 'btn-menu',
      icon: Menu,
      label: language === 'en' ? 'Open Menu' : 'मेनु खोल्नुहोस्',
      action: onOpenDrawer || (() => {}),
      highlight: false
    },
    {
      id: 'btn-ai',
      icon: Sparkles,
      label: 'AI',
      action: onOpenAI,
      highlight: true
    }
  ];

  return (
    <>
      <footer 
         id="app-footer"
         onMouseEnter={() => { setIsHovered(true); onExpandChange?.(true); }}
         onMouseLeave={() => { setIsHovered(false); onExpandChange?.(false); }}
         onClick={(e) => { e.stopPropagation(); onExpandChange?.(!shouldExpand); }}
         className={`fixed bottom-0 left-0 w-full z-[850] transition-all duration-500 ease-out cursor-pointer ${
           shouldExpand
             ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t-2 border-indigo-500/40 dark:border-indigo-400/30 shadow-[0_-4px_32px_rgba(0,0,0,0.08)] py-10 sm:py-14'
             : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-300/60 dark:border-slate-700/60 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] py-3 sm:py-4'
         }`}
       >
        <motion.div 
          className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center"
          animate={{ 
            height: shouldExpand ? 'auto' : 'auto',
            opacity: shouldExpand ? 1 : 0.9,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {shouldExpand && (
            <>
              <div className="flex flex-col items-center mb-2 text-center">
                <div className="w-10 h-1 bg-[#dc2626] mx-auto mb-2 rounded-full"></div>
                <p className="text-[0.5625rem] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-black">
                  {t('secureActionPortal')}
                </p>
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
                                <span className="text-[0.5rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                                  {t('scanToOpen') || 'Scan to Open'}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                        <button
                          id={item.id}
                          onClick={(e) => { e.stopPropagation(); item.action(); }}
                          onMouseEnter={() => { if (item.id === 'btn-share') setIsQrHovered(true); }}
                          onMouseLeave={() => { if (item.id === 'btn-share') setIsQrHovered(false); }}
                          className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer border ${
                            item.id === 'btn-menu'
                              ? 'bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'
                              : item.id === 'btn-ai'
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50'
                          }`}
                          title={item.id === 'btn-menu' ? (language === 'en' ? 'Open Menu' : 'मेनु खोल्नुहोस्') : item.id === 'btn-ai' ? 'AI' : item.id === 'btn-sync' ? (language === 'en' ? 'Refresh' : 'रिफ्रेस') : ''}
                        >
                          {item.id === 'btn-ai' && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                          )}
                          <item.icon size={18} strokeWidth={2.5} className={`${item.id === 'btn-ai' ? 'text-white' : 'text-slate-700 dark:text-slate-300'} sm:size-[20px] transition-colors shrink-0 ${item.id === 'btn-sync' && isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    ))}
                 </div>
               </div>

              <div className="flex flex-col items-center gap-2 mt-4">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
                <p className="text-[0.625rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  © DOR | 2082/83 B.S
                </p>
                <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
              </div>
              <p className="text-[0.5625rem] font-mono tracking-[0.2em] text-slate-400 dark:text-slate-600 uppercase font-medium">
                v2.4.0
              </p>
              {minutesAgo !== null && (
                <p className="text-[0.5625rem] font-mono tracking-[0.2em] text-indigo-500/70 dark:text-indigo-400/70 uppercase font-medium mt-1 truncate">
                  {language === 'en' ? `Last synced: ${minutesAgo}m ago` : `पछिल्लो पटक सिंक: ${minutesAgo} मिनेट अघि`}
                </p>
              )}
            </div>
            </>
          )}

           {!shouldExpand && (
            <div className="flex items-center justify-center gap-0">
              <div className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-pulse"></div>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30"
                >
                  <RefreshCw size={10} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[0.5rem] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {language === 'en' ? 'Syncing' : 'सिंक'}
                  </span>
                </motion.div>
              )}
              {syncSuccess && !isSyncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="ml-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30"
                >
                  <span className="text-[0.5rem] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {language === 'en' ? 'Updated' : 'अपडेट भयो'}
                  </span>
                </motion.div>
              )}
              {minutesAgo !== null && !isSyncing && !syncSuccess && (
                <span className="text-[0.5rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1.5">
                  {language === 'en' ? `Last synced: ${minutesAgo}m ago` : `पछिल्लो पटक सिंक: ${minutesAgo} मिनेट अघि`}
                </span>
              )}
              <div className="h-[2px] w-12 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2 px-3 py-1.5">
                {language === 'en' ? 'Action Portal' : 'कार्य पोर्टल'}
                <motion.span
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    y: [0, 3, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ChevronDown size={16} className="text-indigo-600 dark:text-indigo-400" />
                </motion.span>
              </span>
              <div className="h-[2px] w-12 bg-slate-300 dark:bg-slate-700"></div>
              <div className="h-1 w-1 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-pulse"></div>
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
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-[100] p-6 backdrop-blur-md" 
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
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg text-[0.625rem] font-mono text-slate-600 overflow-hidden">
                  <span className="truncate flex-1">{currentUrl}</span>
                  <button onClick={handleCopy} className="p-1.5 bg-white rounded-md shadow-sm hover:text-indigo-600 cursor-pointer">
                    {copied ? <Check size={12} className="text-emerald-500 font-bold" /> : <Copy size={12} />}
                  </button>
                </div>
                {copied && (
                  <p className="text-[0.625rem] font-bold text-emerald-500 tracking-wider">
                    {language === 'en' ? 'Link Copied!' : 'लिङ्क कपि भयो!'}
                  </p>
                )}
                <div className="pt-2">
                  <p className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-3">
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

