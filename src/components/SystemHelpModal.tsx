import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calculator, Building2, Database, RefreshCw, 
  Scale, ChevronRight, ChevronLeft, Navigation, 
  Layers, Printer, Compass, MousePointerClick, Trash2, 
  Settings2, Smartphone, Sparkles, Clock, LayoutGrid, Target,
  Search, Activity, Mic, Filter, Download, Monitor, Wifi, WifiOff
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { formatDisplayDate } from '../utils/date';
import { getBreakdownStatus } from '../utils/status';
import { Indicator } from '../types';
import { DOR_OFFICES_LIST } from '../data';
import { OfficeCard } from './OfficeCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface SystemHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  offices: { name: string; updated: string }[];
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
  defaultTab?: 'tour' | 'logic' | 'offices' | 'indicators' | 'status' | 'sync' | 'settings' | 'voice';
  isAdmin?: boolean;
  lastUpdateDate?: string;
  pendingWritesCount?: number;
  isOnline?: boolean;
  fiscalYear?: string;
  onStartVoice?: () => void;
  selectedIndicatorId?: string | null;
  addToast?: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

const VOICE_NAVIGATION_COMMANDS = [
  { en: 'table', np: 'तालिका', keywordEn: 'table', keywordNp: 'तालिका' },
  { en: 'card', np: 'कार्ड', keywordEn: 'card', keywordNp: 'कार्ड' },
  { en: 'chart', np: 'चार्ट', keywordEn: 'chart', keywordNp: 'चार्ट' },
  { en: 'trend', np: 'प्रवृत्ति', keywordEn: 'trend', keywordNp: 'प्रवृत्ति' },
  { en: 'heatmap', np: 'हिटम्याप', keywordEn: 'heatmap', keywordNp: 'हिटम्याप' },
  { en: 'dashboard', np: 'ड्यासबोर्ड', keywordEn: 'dashboard', keywordNp: 'ड्यासबोर्ड' },
  { en: 'offices', np: 'कार्यालय', keywordEn: 'office / offices', keywordNp: 'कार्यालय' },
  { en: 'report', np: 'प्रतिवेदन', keywordEn: 'report', keywordNp: 'प्रतिवेदन / रिपोर्ट' },
];

const VOICE_FILTER_COMMANDS = [
  { en: 'infrastructure', np: 'पूर्वाधार', keywordEn: 'infrastructure', keywordNp: 'पूर्वाधार / भौतिक' },
  { en: 'maintenance', np: 'मर्मत', keywordEn: 'maintenance', keywordNp: 'मर्मत / सडक' },
  { en: 'employment', np: 'रोजगारी', keywordEn: 'employment', keywordNp: 'रोजगारी' },
  { en: 'budget', np: 'बजेट', keywordEn: 'budget', keywordNp: 'बजेट' },
  { en: 'governance', np: 'सुशासन', keywordEn: 'governance', keywordNp: 'सुशासन' },
  { en: 'all', np: 'सबै', keywordEn: 'all / clear', keywordNp: 'सबै' },
];

export const SystemHelpModal: React.FC<SystemHelpModalProps> = ({
  isOpen, onClose, indicators = [], offices = [], onSync,
  isSyncing = false, defaultTab = 'tour', lastUpdateDate = 'N/A',
  isOnline = true, fiscalYear, onStartVoice, selectedIndicatorId,
  addToast,
}) => {
  const { language, translateOffice } = useLanguage();
  const { offlineReady } = useRegisterSW();
  useBodyScrollLock(isOpen);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setIsInstallable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () => setIsInstalled(mq.matches);
    updateStandalone();
    mq.addEventListener('change', updateStandalone);
    const onBeforeInstall = () => setIsInstallable(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      mq.removeEventListener('change', updateStandalone);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);
  const [activeTab, setActiveTab] = useState<'tour' | 'logic' | 'offices' | 'indicators' | 'status' | 'sync' | 'settings' | 'voice'>(defaultTab);
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState({ size: '0 KB', totalBytes: 0, timestamp: 'N/A' });
  const [hapticPref, setHapticPref] = useState<'light' | 'medium' | 'heavy' | 'off'>('medium');

  const isVoiceTab = activeTab === 'voice';

  const handleMicClick = useCallback(() => {
    triggerHaptic('medium');
    if (onStartVoice) onStartVoice();
  }, [onStartVoice]);

  // Sync tab selection with defaultTab when the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setStep(0);
      setSearchQuery('');
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen || !selectedIndicatorId || activeTab !== 'indicators') return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`indicator-${selectedIndicatorId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-slate-900');
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isOpen, selectedIndicatorId, activeTab]);

  // Initialize haptic preference on mount
  useEffect(() => {
    // Already initialized in useState, no need to set here
  }, []);

  const handleHapticChange = (intensity: 'light' | 'medium' | 'heavy' | 'off') => {
    setHapticPref(intensity);
    if (intensity !== 'off') {
      triggerHaptic('success');
    }
  };

  const calculateStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const indStr = localStorage.getItem('dor_indicators_cache') || '';
      const metaStr = localStorage.getItem('dor_metadata_cache') || '';
      const totalBytes = indStr.length + metaStr.length;
      const kb = totalBytes / 1024;
      
      let lastSync = localStorage.getItem('dor_last_sync_timestamp');
      if (!lastSync) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - 12);
        lastSync = now.toISOString();
        localStorage.setItem('dor_last_sync_timestamp', lastSync);
      }
      
      setStorageInfo({
        size: `${kb.toFixed(2)} KB`,
        totalBytes,
        timestamp: lastSync
      });
    } catch (e) {
      // Failed to calculate storage silently
    }
  }, []);

  const getRelativeTimeString = useCallback((isoString: string | null) => {
    if (!isoString || isoString === 'N/A') return language === 'en' ? 'Never' : 'कहिल्यै होइन';
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      
      if (diffSec < 15) {
        return language === 'en' ? 'Just now' : 'भर्खरै';
      }
      if (diffSec < 60) {
        return language === 'en' ? `${diffSec}s ago` : `${diffSec} सेकेन्ड अघि`;
      }
      if (diffMin < 60) {
        return language === 'en' ? `${diffMin}m ago` : `${diffMin} मिनेट अघि`;
      }
      if (diffHr < 24) {
        return language === 'en' ? `${diffHr}h ago` : `${diffHr} घण्टा अघि`;
      }
      
      return formatDisplayDate(isoString, language === 'en' ? 'en' : 'np');
    } catch (e) {
      return 'N/A';
    }
  }, [language]);

  const handleClearCache = async () => {
    triggerHaptic('medium');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    calculateStorage();
    addToast(language === 'en' ? 'Cache purged successfully' : 'क्याश सफलतापूर्वक मेटाइयो', 'Cache cleared', 'success');
  };

  const handleCheckUpdate = async () => {
    triggerHaptic('medium');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        addToast(
          language === 'en' ? 'Checking for updates...' : 'अपडेटहरू खोज्दै...',
          'Checking updates',
          'info'
        );
      } else {
        addToast(
          language === 'en' ? 'Service Worker not registered' : 'सर्भिस वर्कर रजिस्टर भएको छैन',
          'No SW',
          'warning'
        );
      }
    } catch {
      addToast(language === 'en' ? 'Failed to check updates' : 'अपडेटहरू जाँच्न सकिएन', undefined, 'error');
    }
  };

  // Recalculate storage on load & when isSyncing finishes
  useEffect(() => {
    if (!isOpen) return;

    if (step === 3) {
      const el = document.getElementById('btn-print') || document.getElementById('app-footer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (step === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, isOpen]);

  const totalSteps = 4; // Step 0 (Welcome), Step 1 (Drawer), Step 2 (Switcher), Step 3 (Report)

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  // Offices Aggregation
  const uniqueOffices = offices.length > 0 ? offices : DOR_OFFICES_LIST;

  // Status Breakdown Aggregation (matches the Status Breakdown card / StatusBreakdownModal)
  const statusBreakdown = useMemo(() => {
    const map = { onTrack: 0, needsAttention: 0, stale: 0 };
    indicators.forEach((ind) => {
      if (!ind) return;
      const status = getBreakdownStatus(ind);
      map[status] += 1;
    });
    return map;
  }, [indicators]);

   const statusTotal = indicators.length || 1;

   const statusConfig = [
     { key: 'onTrack', labelEn: 'On Track', labelNp: 'अनुसरण', color: '#10b981' },
     { key: 'needsAttention', labelEn: 'Needs Attention', labelNp: 'ध्यान', color: '#f59e0b' },
     { key: 'stale', labelEn: 'Stale', labelNp: 'पुरानो', color: '#ef4444' },
   ] as const;

   const statusChartData = statusConfig.map((c) => ({
     name: c.labelEn,
     value: statusBreakdown[c.key],
     color: c.color,
   }));

   const filteredOffices = uniqueOffices.filter(o => 
     (language === 'en' ? translateOffice(o.name) : o.name).toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (!isOpen) return null;

    return (
      <AnimatePresence>
        <div className="absolute inset-0 z-[9999] overflow-hidden pointer-events-none">
         {/* Semi-transparent dark backdrop */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs pointer-events-auto"
         />

         {/* STEP 0: Unified Modal Container */}
         {step === 0 && (
           <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 30 }}
               transition={{ type: 'spring', damping: 25, stiffness: 210 }}
               className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[85vh] pointer-events-auto"
             >
               {/* Header with narrow branding */}
               <div className="relative px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-sm shrink-0">
                     <img src="/GovtLogo.svg" alt="Government of Nepal Logo" className="w-[66%] h-[66%] object-contain" referrerPolicy="no-referrer" />
                   </div>
                   <div className="leading-tight">
                     <p className="font-display text-[0.75rem] sm:text-[0.85rem] font-black uppercase text-slate-800 dark:text-white tracking-tight">DORPTS</p>
                     <p className="text-[0.6rem] sm:text-[0.65rem] font-extrabold uppercase tracking-tight text-[#0099DA] dark:text-[#00ADF7] leading-none">
                       {language === 'en' ? 'System Guide' : 'प्रणाली निर्देशिका'}
                     </p>
                   </div>
                 </div>

                 <button
                   onClick={() => {
                     triggerHaptic('light');
                     onClose();
                   }}
                   className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 transition-all active:scale-90"
                 >
                   <X size={20} />
                 </button>
               </div>

               {/* Navigation Tabs - Modern Pill Style */}
               <div className="px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 shrink-0">
                 <div className="flex items-center justify-center flex-wrap gap-1.5 py-1">
                    {[
                      { id: 'tour', icon: <Compass size={13} />, labelEn: 'Tour', labelNp: 'टुर' },
                      { id: 'logic', icon: <Calculator size={13} />, labelEn: 'Logic', labelNp: 'विधि' },
                      { id: 'voice', icon: <Mic size={13} />, labelEn: 'Voice', labelNp: 'आवाज' },
                      { id: 'offices', icon: <Building2 size={13} />, labelEn: 'Offices', labelNp: 'कार्यालय' },
                       { id: 'indicators', icon: <LayoutGrid size={13} />, labelEn: 'INDICATORS', labelNp: 'सूचक' },
                       { id: 'status', icon: <Activity size={13} />, labelEn: 'STATUS', labelNp: 'स्थिति' },
                       { id: 'sync', icon: <Database size={13} />, labelEn: 'Data', labelNp: 'डाटा' },
                      { id: 'settings', icon: <Settings2 size={13} />, labelEn: 'Config', labelNp: 'सेटिङ' },
                      { id: 'app', icon: <Smartphone size={13} />, labelEn: 'App', labelNp: 'एप' }
                    ].map((tab) => (
                     <button
                       key={tab.id}
                       onClick={() => {
                         triggerHaptic('light');
                         setActiveTab(tab.id as SystemHelpModalProps['defaultTab']);
                       }}
                       className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap ${
                         activeTab === tab.id
                           ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                           : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                       }`}
                     >
                       {tab.icon}
                       <span>{language === 'en' ? tab.labelEn : tab.labelNp}</span>
                     </button>
                   ))}
                 </div>
                </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* TAB: TOUR */}
                {activeTab === 'tour' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 pt-4 pb-4"
                  >
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-[24px] blur-xl animate-pulse" />
                      <div className="relative w-full h-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-[24px] flex items-center justify-center shadow-inner border border-indigo-100/50 dark:border-indigo-500/20">
                        <Compass size={32} />
                      </div>
                    </div>

                     <div className="space-y-2">
                       <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                         {language === 'en' ? 'Welcome' : 'स्वागत छ'}
                       </h3>
                       <div className="flex items-center justify-center gap-2">
                         <Sparkles size={14} className="text-amber-500" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                           {language === 'en' ? 'System Tour' : 'प्रणाली टुर'}
                         </p>
                       </div>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl p-6 border border-slate-100 dark:border-white/5 max-w-lg mx-auto">
                       <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                         {language === 'en' 
                           ? 'Quick guide to navigating the dashboard, reading indicators, and using built-in tools.'
                           : 'ड्यासबोर्ड नेभिगेट गर्न, सूचकहरू पढ्न र अन्तर्निर्मित उपकरणहरू प्रयोग गर्न छिटो गाइड।'}
                       </p>
                     </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto pt-4">
                      <button
                        onClick={handleNext}
                        className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{language === 'en' ? 'Begin Journey' : 'सुरु गर्नुहोस्'}</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB: CALCULATION LOGIC */}
                {activeTab === 'logic' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 text-left pb-6"
                  >
                    <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                          <Scale size={20} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {language === 'en' ? 'Performance Algorithm' : 'कार्यसम्पादन विधि'}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                        {language === 'en'
                          ? `The system employs a Strategic Weighted Average (SWA) model. Critical infrastructure Indicators carry higher impact weights, ensuring the total percentage accurately reflects departmental priorities.`
                          : `प्रणालीले रणनीतिक भारित औसत (SWA) मोडेल प्रयोग गर्दछ। महत्त्वपूर्ण पूर्वाधार सूचकहरूको भार बढी हुन्छ, जसले समग्र प्रतिशतले विभागको प्राथमिकतालाई सही रूपमा प्रतिबिम्बित गर्दछ।`}
                      </p>

                      {/* Mathematical Formula Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 font-mono text-center shadow-lg">
                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4">
                          {language === 'en' ? 'Core Equation' : 'मुख्य समीकरण'}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {language === 'en' ? 'Total Score' : 'कुल स्कोर'} % =
                          </span>
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 px-4">
                              Σ (Achievement % × Weight)
                            </span>
                            <div className="w-full h-px bg-slate-200 dark:bg-white/10 my-1" />
                            <span className="text-[11px] sm:text-xs font-black text-slate-400">
                              Σ (Total Active Weight)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mathematical Divergence Clarification Box */}
                      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-[24px] p-5 text-left mt-6">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
                            <Scale size={16} />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                              {language === 'en' ? 'Strategic vs. Weighted Divergence' : 'रणनीतिक बनाम भारित कार्यसम्पादन'}
                            </h5>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                              {language === 'en'
                                ? 'Why are they sometimes equal? On our starting baseline data, both models align at around 78% due to balanced indicators. However, they use distinct mathematical formulas:'
                                : 'किन कहिलेकाहीँ समान देखिन्छन्? सुरुवाती आधारभूत तथ्याङ्कमा, दुवै मोडेलहरू लगभग ७८% मा सन्तुलित देखिन्छन्। तर यिनीहरूले फरक गणितीय सूत्र प्रयोग गर्दछन्:'}
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
                              <li>
                                <strong>{language === 'en' ? 'Strategic Average' : 'रणनीतिक औसत'}</strong>:{' '}
                                {language === 'en'
                                  ? 'Treats each of the 5 high-impact sectors with equal 20% importance (e.g., Infrastructure progress counts as 20%, Budget counts as 20% of the overall score).'
                                  : 'पाँचवटै उच्च-प्रभाव क्षेत्रहरूलाई समान २०% महत्त्व दिन्छ (जस्तै पूर्वाधारको प्रगति २०%, बजेटको प्रगति २०%)।'}
                              </li>
                              <li>
                                <strong>{language === 'en' ? 'Weighted Average' : 'भारित औसत'}</strong>:{' '}
                                {language === 'en'
                                  ? 'Ignores sector groupings and scales strictly based on each of the 17 indicators individual priority weight.'
                                  : 'क्षेत्रगत समूहहरूलाई छोडेर प्रत्येक १७ सूचकहरूको व्यक्तिगत प्राथमिकता भारको आधारमा मात्र स्क्यालिङ गर्दछ।'}
                              </li>
                            </ul>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2 italic">
                              {language === 'en'
                                ? '→ As progress updates flow in, these two percentages will dynamically diverge!'
                                : '→ प्रगति विवरणहरू अद्यावधिक हुँदा, यी दुई प्रतिशतहरू फरक-फरक दरमा परिवर्तन हुनेछन्!'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weight Breakdown - Bento Style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm group hover:border-indigo-500/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                          <Target size={16} />
                        </div>
                        <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                          {language === 'en' ? 'High Impact' : 'उच्च प्रभाव'}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {language === 'en'
                            ? 'Core Indicators like Road Blacktopping and Bridge completion are prioritized with weights up to 40%.'
                            : 'सडक कालोपत्रे र पुल निर्माण जस्ता मुख्य सूचकहरूलाई ४०% सम्मको भारका साथ प्राथमिकता दिइन्छ।'}
                        </p>
                      </div>
                      <div className="p-6 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm group hover:border-blue-500/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                          <Layers size={16} />
                        </div>
                        <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                          {language === 'en' ? 'Observational' : 'अवलोकन सूचक'}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {language === 'en'
                            ? 'Secondary tasks (gravel roads, minor repairs) are monitored with 0 weight to track but not skew averages.'
                            : 'दोस्रो कार्यहरू (ग्राभेल, सानो मर्मत) लाई औसत नबिग्रियोस् भन्नका लागि ० भारका साथ अनुगमन गरिन्छ।'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* TAB: ENGAGED OFFICES */}
                {activeTab === 'offices' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-left pb-6"
                  >
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100/50 dark:border-indigo-500/20">
                       <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                         {language === 'en'
                           ? 'All DoR project offices and their assigned indicators.'
                           : 'सडक विभागका सबै आयोजना कार्यालयहरू र तिनलाई असाइन गरिएका सूचकहरू।'}
                       </p>
                     </div>

                    {/* Search bar */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'Search engaged offices...' : 'कार्यालयहरू खोज्नुहोस्...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredOffices.map((office, idx) => (
                        <OfficeCard key={`${office.name}-${idx}`} office={office} variant="grid" index={idx} />
                      ))}
                      {filteredOffices.length === 0 && (
                        <div className="col-span-full text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                            <Search size={20} />
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {language === 'en' ? 'No results matched your query' : 'कुनै नतिजा फेला परेन'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB: INDICATORS LIST */}
                {activeTab === 'indicators' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-left pb-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                        {language === 'en'
                          ? 'All tracked KPIs by sector and SDG goal.'
                          : 'क्षेत्र र SDG लक्ष्य अनुसार सबै ट्र्याक गरिएका KPIs।'}
                      </p>
                      
                      <div className="relative group shrink-0 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder={language === 'en' ? 'Filter KPIs...' : 'सूचक फिल्टर...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                      {indicators
                        .filter(Boolean)
                        .filter(ind => 
                          (ind.nameEn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ind.nameNp || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ind.id || "").toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((ind, idx) => (
                           <motion.div
                             key={ind.id}
                             id={`indicator-${ind.id}`}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.01 }}
                             className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:border-indigo-500/20 transition-colors shadow-sm"
                           >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-black text-slate-400 leading-none mb-0.5">#{ind.id.replace('ind_', '')}</span>
                              <LayoutGrid size={12} className="text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {language === 'en' ? ind.nameEn : ind.nameNp}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                  ind.category === 'Road' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' :
                                  ind.category === 'Bridge' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' :
                                  ind.category === 'Safety' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' :
                                  'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                }`}>
                                  {ind.category}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight: {ind.weight}%</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* TAB: STATUS BREAKDOWN */}
                {activeTab === 'status' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-left pb-6"
                  >
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {language === 'en' ? 'Status Breakdown' : 'स्थिति विवरण'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {language === 'en'
                          ? 'How many indicators are On Track, need Attention, or have Stale data.'
                          : 'कति सूचकहरू अनुसरणमा छन्, ध्यान आवश्यक छ, वा पुरानो डाटा भएका छन्।'}
                      </p>
                    </div>

                    {/* Stacked Breakdown Bar */}
                    <div className="w-full flex h-5 rounded-full overflow-hidden border border-slate-100 dark:border-white/5">
                      {statusConfig.map((c) => {
                        const count = statusBreakdown[c.key];
                        const pct = Math.round((count / statusTotal) * 100);
                        if (count === 0) return null;
                        return (
                          <div
                            key={c.key}
                            className="h-full flex items-center justify-center text-[9px] font-black text-white transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: c.color }}
                            title={`${language === 'en' ? c.labelEn : c.labelNp}: ${count}`}
                          >
                            {pct >= 10 ? `${pct}%` : ''}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                      {/* Donut Chart */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-[220px]">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                              >
                                {statusChartData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value: number, name: string) => [`${value} ${language === 'en' ? 'indicators' : 'सूचक'}`, name]}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="text-center mt-2">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                              {language === 'en' ? 'Total' : 'कुल'}
                            </p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{indicators.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Legend with real values */}
                      <div className="space-y-2">
                        {statusConfig.map((c) => {
                          const count = statusBreakdown[c.key];
                          const pct = Math.round((count / statusTotal) * 100);
                          return (
                            <div key={c.key} className="flex items-center gap-3 rounded-2xl p-3 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-white">
                                  {language === 'en' ? c.labelEn : c.labelNp}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{pct}% of indicators</p>
                              </div>
                              <span className="text-lg font-black text-slate-900 dark:text-white">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: DATA CORE & SYNC */}
                {activeTab === 'sync' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-left pb-6"
                  >
                    <div className="bg-slate-950 rounded-[32px] p-6 sm:p-8 border border-white/5 relative overflow-hidden text-white shadow-2xl">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                      
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                          <Database size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-tight leading-none">
                            {language === 'en' ? 'System Data Core' : 'डाटा केन्द्र'}
                          </h4>
                          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1.5">
                            Cloud-Native Infrastructure
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-indigo-100/70 leading-relaxed mb-8 relative z-10">
                         {language === 'en'
                           ? 'Real-time sync between local cache and live database.'
                           : 'स्थानीय क्यास र लाइभ डाटाबेसबीच वास्तविक-समय सिङ्क।'}
                       </p>

                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        {[
                          { 
                            labelEn: 'Status', 
                            labelNp: 'अवस्था', 
                            value: isOnline ? (language === 'en' ? 'Online' : 'अनलाइन') : (language === 'en' ? 'Offline' : 'अफलाइन'),
                            icon: <Activity size={14} />,
                            color: isOnline ? 'emerald' : 'rose'
                          },
                          { 
                            labelEn: 'Last Sync', 
                            labelNp: 'पछिल्लो सिङ्क', 
                            value: getRelativeTimeString(lastUpdateDate),
                            icon: <Clock size={14} />,
                            color: 'indigo'
                          }
                        ].map((stat, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2 text-indigo-400">
                              {stat.icon}
                              <span className="text-[9px] font-black uppercase tracking-widest">{language === 'en' ? stat.labelEn : stat.labelNp}</span>
                            </div>
                            <div className={`text-xs font-black uppercase tracking-tight ${stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'rose' ? 'text-rose-400' : 'text-white'}`}>
                              {stat.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 rounded-[24px] bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-white/5">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Storage Intelligence</h5>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{storageInfo.size}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cache footprint</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              triggerHaptic('medium');
                              if (onSync) {
                                await onSync();
                                calculateStorage();
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2"
                          >
                            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                            {language === 'en' ? 'Sync' : 'सिङ्क'}
                          </button>
                          <button
                            onClick={handleCheckUpdate}
                            className="px-4 py-2 bg-amber-100 hover:bg-amber-50 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-[10px] font-black text-amber-700 dark:text-amber-400 rounded-xl transition-all flex items-center gap-2"
                          >
                            <RefreshCw size={12} />
                            {language === 'en' ? 'Update' : 'अपडेट'}
                          </button>
                          <button
                            onClick={handleClearCache}
                            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:text-rose-500 rounded-xl transition-all flex items-center gap-2"
                          >
                            <Trash2 size={12} />
                            {language === 'en' ? 'Purge' : 'मेटाउनुहोस्'}
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((storageInfo.totalBytes / 5000000) * 100, 100)}%` }}
                          className="h-full bg-indigo-500" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: VOICE COMMANDS */}
                {activeTab === 'voice' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-left pb-6"
                  >
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100/50 dark:border-indigo-500/20 flex gap-3">
                      <button
                        onClick={handleMicClick}
                        className="shrink-0 mt-0.5 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all cursor-pointer"
                        title={language === 'en' ? 'Start voice command' : 'आवाज आदेश सुरु गर्नुहोस्'}
                      >
                        <Mic size={20} className="animate-pulse" />
                      </button>
                      <div>
                        <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                          {language === 'en'
                            ? 'Voice Commands — Tap Mic to speak'
                            : 'आवाज आदेश — बोल्न माइक थिच्नुहोस्'}
                        </p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed">
                          {language === 'en'
                            ? 'Short words work best: "table", "chart", "heatmap", "dashboard", "offices", "report".'
                            : 'छोटो शब्दहरू राम्रो काम गर्छन्: "table", "chart", "heatmap", "dashboard", "offices", "report".'}
                        </p>
                      </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'Search voice phrases or keywords...' : 'आवाज आदेश वा कुञ्जीशब्दहरू खोज्नुहोस्...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                      />
                    </div>

                    {/* Navigation Commands Category */}
                    {VOICE_NAVIGATION_COMMANDS.filter(cmd => 
                      cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                          <Navigation size={14} className="text-slate-400 dark:text-slate-500" />
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {language === 'en' ? 'Navigation Commands' : 'दृश्य परिवर्तन गर्ने आदेशहरू'}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {VOICE_NAVIGATION_COMMANDS
                            .filter(cmd => 
                              cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((cmd, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-colors shadow-xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                                      {language === 'en' ? 'Phrase' : 'वाक्यांश'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">
                                      {language === 'en' ? 'Navigate' : 'नेभिगेसन'}
                                    </span>
                                  </div>
                                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    "{language === 'en' ? cmd.en : cmd.np}"
                                  </p>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100/60 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="font-semibold text-slate-500 shrink-0">{language === 'en' ? 'Triggers:' : 'सङ्केत:'}</span>
                                    <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[9px] truncate">
                                      {language === 'en' ? cmd.keywordEn : cmd.keywordNp}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Filter Commands Category */}
                    {VOICE_FILTER_COMMANDS.filter(cmd => 
                      cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                          <Filter size={14} className="text-slate-400 dark:text-slate-500" />
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {language === 'en' ? 'Filter & Search Commands' : 'सूचक फिल्टर गर्ने आदेशहरू'}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {VOICE_FILTER_COMMANDS
                            .filter(cmd => 
                              cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((cmd, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex flex-col justify-between hover:border-emerald-500/20 transition-colors shadow-xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                      {language === 'en' ? 'Phrase' : 'वाक्यांश'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">
                                      {language === 'en' ? 'Filter' : 'फिल्टर'}
                                    </span>
                                  </div>
                                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    "{language === 'en' ? cmd.en : cmd.np}"
                                  </p>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100/60 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="font-semibold text-slate-500 shrink-0">{language === 'en' ? 'Triggers:' : 'सङ्केत:'}</span>
                                    <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[9px] truncate">
                                      {language === 'en' ? cmd.keywordEn : cmd.keywordNp}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {VOICE_NAVIGATION_COMMANDS.filter(cmd => 
                      cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && VOICE_FILTER_COMMANDS.filter(cmd => 
                      cmd.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      cmd.keywordNp.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                          <Search size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {language === 'en' ? 'No voice phrases matched your search' : 'कुनै आवाज वाक्यांशहरू फेला परेनन्'}
                         </p>
                       </div>
                     )}

                    {/* Office Score Logic */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm mt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                          <Building2 size={18} />
                        </div>
                        <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                          {language === 'en' ? 'Reporting Offices Score' : 'विवरण पठाउने कार्यालय स्कोर'}
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                        {language === 'en'
                          ? 'Each office’s percentage is calculated from the Offices sheet, not from the Dashboard indicators. The system compares each office’s values against the Total row of the Offices sheet to derive completion percentages.'
                          : 'प्रत्येक कार्यालयको प्रतिशत ड्यासबोर्ड सूचकहरूबाट होइन, कार्यालय शीटबाट गणना गरिन्छ। प्रणालीले पूरा हुने प्रतिशतहरू निकाल्न कार्यालयको मानहरूलाई कार्यालय शीटको कुल पङ्क्तिसँग तुलना गर्दछ।'}
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-4 font-mono text-center">
                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">
                          {language === 'en' ? 'Office Completion Formula' : 'कार्यालय पूरा हुने सूत्र'}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white">
                            {language === 'en' ? 'Office %' : 'कार्यालय %'} =
                          </span>
                          <span className="text-[10px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 px-4">
                            Σ [(office value ÷ total value) × 100] ÷ number of columns
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
                        {language === 'en'
                          ? 'Offices without indicator data display “—” instead of 0%. The list updates live when the published Offices sheet is modified.'
                          : 'सूचक तथ्याङ्क बिना कार्यालयहरूमा ०% को सट्टा “—” देखाइन्छ। प्रकाशित कार्यालय शीट परिवर्तन भएपछि सूची लाइव अद्यावधिक हुन्छ।'}
                      </p>
                    </div>
                   </motion.div>
                 )}

                {/* TAB: SETTINGS */}
                {activeTab === 'settings' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 text-left pt-1"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm mt-0.5">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === 'en' ? 'Haptic Feedback Engine' : 'ह्याप्टिक प्रतिक्रिया इन्जिन'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {language === 'en'
                            ? 'Adjust the intensity of device vibration when interacting with buttons, charts, and menus.'
                            : 'बटनहरू, चार्टहरू र मेनुहरू प्रयोग गर्दा उपकरणको कम्पन तीव्रता समायोजन गर्नुहोस्।'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                        {language === 'en' ? 'Intensity Level' : 'तीव्रता स्तर'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHapticChange('off')}
                          className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer border ${
                            hapticPref === 'off'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {language === 'en' ? 'Off' : 'बन्द'}
                        </button>
                        <button
                          onClick={() => handleHapticChange('light')}
                          className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer border ${
                            hapticPref === 'light'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {language === 'en' ? 'Light' : 'हल्का'}
                        </button>
                        <button
                          onClick={() => handleHapticChange('medium')}
                          className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer border ${
                            hapticPref === 'medium'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {language === 'en' ? 'Medium' : 'मध्यम'}
                        </button>
                        <button
                          onClick={() => handleHapticChange('heavy')}
                          className={`flex-1 py-2 px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer border ${
                            hapticPref === 'heavy'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {language === 'en' ? 'Heavy' : 'बलियो'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: APP / INSTALL / UPDATE */}
                {activeTab === 'app' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 text-left pt-1"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm mt-0.5">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {language === 'en' ? 'Install App' : 'एप इन्स्टल गर्नुहोस्'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {language === 'en'
                            ? 'Install DORPTS on your device for full-screen access, offline support, and instant launch from your home screen.'
                            : 'पूर्ण स्क्रिन पहुँच, अफलाइन समर्थन, र होम स्क्रिनबाट तत्काल ल्याउनका लागि आफ्नो उपकरणमा DORPTS इन्स्टल गर्नुहोस्।'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            {language === 'en' ? 'Desktop (Chrome/Edge)' : 'डेस्कटप (क्रोम/एज)'}
                          </span>
                        </div>
                        <ol className="space-y-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-snug list-decimal list-inside">
                          <li>{language === 'en' ? 'Click the install icon in the address bar' : 'अड्रेस बारमा इन्स्टल आइकन क्लिक गर्नुहोस्'}</li>
                          <li>{language === 'en' ? 'Or open browser menu (⋮) → Install App' : 'वा ब्राउजर मेनु (⋮) → Install App खोल्नुहोस्'}</li>
                          <li>{language === 'en' ? 'Confirm to add to desktop/apps' : 'डेस्कटप/एपहरूमा थप्न प्रमाणित गर्नुहोस्'}</li>
                        </ol>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            {language === 'en' ? 'Mobile (iOS/Android)' : 'मोबाइल (iOS/Android)'}
                          </span>
                        </div>
                        <ol className="space-y-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-snug list-decimal list-inside">
                          <li>{language === 'en' ? 'Open in Safari (iOS) or Chrome (Android)' : 'Safari (iOS) वा Chrome (Android) मा खोल्नुहोस्'}</li>
                          <li>{language === 'en' ? 'Tap Share → Add to Home Screen' : 'Share → Add to Home Screen मा ट्याप गर्नुहोस्'}</li>
                          <li>{language === 'en' ? 'Tap Add to install' : 'इन्स्टल गर्न Add मा ट्याप गर्नुहोस्'}</li>
                        </ol>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2 mb-3">
                        <RefreshCw size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          {language === 'en' ? 'App Updates' : 'एप अपडेटहरू'}
                        </span>
                      </div>
                      <div className="space-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-snug">
                        <p>
                          {language === 'en'
                            ? 'This app updates automatically. When a new version is deployed, a prompt appears at the bottom of the screen. Tap "Reload" to apply the update instantly.'
                            : 'यो एप स्वतः अपडेट हुन्छ। नयाँ संस्करण डिप्लोय भएपछि स्क्रिनको तलतिर प्रोम्प्ट देखा पर्छ। तुरंत अपडेट लागू गर्न "Reload" मा ट्याप गर्नुहोस्।'}
                        </p>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
                            <Wifi size={14} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {language === 'en'
                              ? 'Keep the app open while connected to the internet. The update banner appears automatically when a new version is available.'
                              : 'इन्टरनेट जडान भएको अवधिमा एप खुला राख्नुहोस्। नयाँ संस्करण उपलब्ध भएपछि अपडेट ब्यानर स्वतः देखा पर्छ।'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2 mb-3">
                        <WifiOff size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          {language === 'en' ? 'Offline Mode' : 'अफलाइन मोड'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-snug">
                        {language === 'en'
                          ? 'Once installed, the app works offline. Data entered while offline syncs automatically when you reconnect.'
                          : 'एक पटक इन्स्टल भएपछि एप अफलाइनमा पनि काम गर्छ। अफलाइनमा प्रविष्ट गरिएको डाटा जडान भएपछि स्वतः सिन्क हुन्छ।'}
                      </p>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                   © DOR | 2082/83 B.S
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* STEP 1: Side-Drawer Highlight */}
        {step === 1 && (
          <>
            {/* Spotlight highlight over drawer button (top right area) */}
            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-12 h-12 rounded-full ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950/40 bg-indigo-500/10 animate-pulse pointer-events-none z-50" />

            {/* SVG Directional Arrow */}
            <svg className="absolute top-16 right-16 w-16 h-16 text-indigo-400 z-50 hidden sm:block" fill="none" viewBox="0 0 100 100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20,80 Q50,70 80,30" className="stroke-dasharray-5" />
              <path d="M80,30 L70,30 M80,30 L80,40" />
            </svg>

            {/* Guide Card */}
            <div className="absolute top-20 right-4 sm:right-12 max-w-xs w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-3 pointer-events-auto z-50">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                  <Navigation size={10} />
                  {language === 'en' ? 'Step 1 of 3' : 'चरण १ / ३'}
                </span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14} /></button>
              </div>

              <div className="space-y-1 text-left">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'en' ? 'New Navigation Drawer' : 'नयाँ मेनु ड्रअर'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Click the menu icon to open the sliding side-drawer containing official Ministry portals, Department of Roads contacts, and support documentation.'
                    : 'आधिकारिक मन्त्रालय र विभागका लिङ्कहरू, आपतकालीन सम्पर्क नम्बरहरू र सहयोग दस्तावेजहरू समावेश भएको नयाँ मेनु ड्रअर खोल्न यो बटन क्लिक गर्नुहोस्।'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={handlePrev} className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronLeft size={12} />{language === 'en' ? 'Back' : 'पछाडि'}</button>
                <button onClick={handleNext} className="px-3 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-0.5">{language === 'en' ? 'Next' : 'अगाडि'}<ChevronRight size={12} /></button>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: View Switcher Highlight */}
        {step === 2 && (
          <>
            {/* Spotlight highlight over View Switcher (bottom right area) */}
            <div className="absolute bottom-24 right-6 w-12 h-12 rounded-full ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950/40 bg-indigo-500/10 animate-pulse pointer-events-none z-50" />

            {/* SVG Directional Arrow */}
            <svg className="absolute bottom-36 right-16 w-16 h-16 text-indigo-400 z-50 hidden sm:block" fill="none" viewBox="0 0 100 100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20,20 Q50,30 80,70" className="stroke-dasharray-5" />
              <path d="M80,70 L70,70 M80,70 L80,60" />
            </svg>

            {/* Guide Card */}
            <div className="absolute bottom-44 right-4 sm:right-12 max-w-xs w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-3 pointer-events-auto z-50">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                  <Layers size={10} />
                  {language === 'en' ? 'Step 2 of 3' : 'चरण २ / ३'}
                </span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14} /></button>
              </div>

              <div className="space-y-1 text-left">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'en' ? 'Interactive View Switcher' : 'अन्तरक्रियात्मक भ्यू स्विचर'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Click this button to dynamically toggle views. Switch seamlessly between statistical grid, bento charts, full tables, and progress trends.'
                    : 'साधारण क्लिकमा भ्यूहरू परिवर्तन गर्नुहोस्! कुल प्रगति ग्राफ, विस्तृत तालिका, र प्रगति ट्रेन्डहरू बीच सहजै टगल गर्न यो बटन थिच्नुहोस्।'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={handlePrev} className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronLeft size={12} />{language === 'en' ? 'Back' : 'पछाडि'}</button>
                <button onClick={handleNext} className="px-3 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-0.5">{language === 'en' ? 'Next' : 'अगाडि'}<ChevronRight size={12} /></button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Report Builder Highlight */}
        {step === 3 && (
          <>
            {/* Spotlight highlight over footer report button */}
            <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-48 h-16 rounded-2xl ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950/40 bg-indigo-500/10 animate-pulse pointer-events-none z-50" />

            {/* SVG Directional Arrow */}
            <svg className="absolute bottom-36 left-1/2 -translate-x-1/2 w-16 h-16 text-indigo-400 z-50 hidden sm:block" fill="none" viewBox="0 0 100 100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50,10 L50,80" className="stroke-dasharray-5" />
              <path d="M50,80 L40,70 M50,80 L60,70" />
            </svg>

            {/* Guide Card */}
            <div className="absolute bottom-48 left-1/2 -translate-x-1/2 max-w-sm w-11/12 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-3 pointer-events-auto z-50">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                  <Printer size={10} />
                  {language === 'en' ? 'Step 3 of 3' : 'चरण ३ / ३'}
                </span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14} /></button>
              </div>

              <div className="space-y-1 text-left">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Printer size={14} className="text-indigo-600 dark:text-indigo-400" />
                  {language === 'en' ? 'Consolidated Report Builder' : 'एकीकृत प्रतिवेदन निर्माता'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Click Print in the footer to customize report titles, filter specific indicators, toggle aggregate statistics, and instantly compile official print-ready summaries.'
                    : 'प्रतिवेदनको शीर्षक राख्न, निश्चित आयोजनाहरू छनोट गर्न वा तथ्याङ्क सारांश समावेश गर्न फुटरको प्रिन्ट विकल्प प्रयोग गरी व्यावसायिक प्रतिवेदन तयार पार्नुहोस्।'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={handlePrev} className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronLeft size={12} />{language === 'en' ? 'Back' : 'पछाडि'}</button>
                <button onClick={onClose} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                  <span>{language === 'en' ? 'Finish Tour' : 'टुर पूरा गर्नुहोस्'}</span>
                  <MousePointerClick size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AnimatePresence>
  );
};
