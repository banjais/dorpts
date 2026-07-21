import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Monitor, Languages, CloudUpload, Type, Info, X, Menu } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import { speak } from '../utils/speech';
import { useAuth } from '../context/AuthContext';
import { useTextScale, TextScale } from '../hooks/useTextScale';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_TITLES } from '../constants/appTitles';
import { NAV_ITEMS } from './NavigationMenu';
import type { MainView } from '../types';
import { LayoutDashboard, TrendingUp, Activity, Building2 } from 'lucide-react';

interface HeaderProps {
  lastUpdateDate?: string;
  pulseKey?: number;
  onOpenMap?: () => void;
  isOnline?: boolean;
  pendingWrites?: { id: string; name: string; nameEn: string }[];
  offices?: { name: string; updated: string }[];
  onOpenAbout?: () => void;
  onOpenDrawer?: () => void;
  onMouseEnterAbout?: () => void;
  onMouseLeaveAbout?: () => void;
  isAtBottom?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  sortType?: 'default' | 'low' | 'high';
  selectedCategory?: string;
  mainView?: MainView;
  onViewChange?: (view: MainView) => void;
  fiscalYear?: string;
  onMouseEnterFab?: () => void;
  onMouseLeaveFab?: () => void;
}

const getSyncedAgoText = (diffMs: number, lang: 'en' | 'ne'): string => {
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (lang === 'ne') {
    if (diffMin < 1) {
      return 'भर्खरै';
    }
    if (diffMin === 1) {
      return '१ मिनेट अघि';
    }
    // Convert minutes to Nepali numerals
    const nepaliNumerals: Record<string, string> = {
      '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
      '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
    };
    const nepaliMin = String(diffMin).split('').map(digit => nepaliNumerals[digit] || digit).join('');
    return `${nepaliMin} मिनेट अघि`;
  } else {
    if (diffMin < 1) {
      return 'just now';
    }
    if (diffMin === 1) {
      return '1 minute ago';
    }
    return `${diffMin} minutes ago`;
  }
};

const TEXT_SCALE_CYCLE: TextScale[] = ['small', 'medium', 'large', 'xlarge'];

export const Header: React.FC<HeaderProps> = ({
  lastUpdateDate = '2083/02/30',
  pulseKey = 0,
  onOpenMap,
  isOnline = true,
  pendingWrites = [],
  offices = [],
  onOpenAbout,
  onOpenDrawer,
  onMouseEnterAbout,
  onMouseLeaveAbout,
  isAtBottom = false,
  searchQuery = '',
  onSearch = () => {},
  sortType = 'default',
  onSortChange = () => {},
  mainView = 'dashboard',
  onViewChange = (view: MainView) => {},
  selectedCategory = 'All',
  onCategoryChange = (category: string) => {},
  showMilestonesOnly = false,
  onToggleMilestonesOnly = () => {},
  viewMode = 'dashboard',
  viewOptions = [],
  indicators = [],
  metadata = null,
  trackedIds = [],
  onToggleTrack = (id: string) => {},
  updatesHistory = [],
  selectedOffice = 'All',
  onOfficeChange = (office: string) => {},
  fiscalYear,
  onMouseEnterFab,
  onMouseLeaveFab,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(() => new Date());
  const [isPendingWritesOpen, setIsPendingWritesOpen] = useState(false);
  const [syncedAgoText, setSyncedAgoText] = useState<string>('');

  const sparklineData = React.useMemo(() => {
    if (!updatesHistory || updatesHistory.length === 0) return [];
    const sortedHistory = [...updatesHistory].sort((a, b) =>
        new Date(a.createdAt || a.id).getTime() - new Date(b.createdAt || b.id).getTime()
    );
    return sortedHistory.map(historyItem => {
        const indicators = historyItem.indicators || [];
        const totalTarget = indicators.reduce((sum: number, ind: any) => sum + (ind.annualTarget || 0), 0);
        const totalProgress = indicators.reduce((sum: number, ind: any) => sum + (ind.annualProgress || 0), 0);
        return {
            percent: totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0
        };
    });
  }, [updatesHistory]);

  useEffect(() => {
    setLastSyncedTime(new Date());
  }, [pulseKey]);

  useEffect(() => {
    const updateText = () => {
      const diffMs = new Date().getTime() - lastSyncedTime.getTime();
      setSyncedAgoText(getSyncedAgoText(diffMs, language));
    };

    updateText(); // run once immediately
    const interval = setInterval(updateText, 10000); // update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSyncedTime, language]);

  type ThemePref = 'light' | 'dark' | 'system';
  const { user } = useAuth();
  const [hasLoadedFromFirestore, setHasLoadedFromFirestore] = useState(false);

  const [themePref, setThemePref] = useState<ThemePref>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved as ThemePref;
        }
      } catch (_) {}
    }
    return 'system';
  });

  // Sync theme with Firestore when authenticated user logs in
  useEffect(() => {
    if (!user) {
      setHasLoadedFromFirestore(false);
      return;
    }

    let isSubscribed = true;
    const fetchUserTheme = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && isSubscribed) {
          const data = userSnap.data();
          if (data && (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system')) {
            setThemePref(data.theme);
          }
        }
      } catch (err) {
        console.error('Error fetching user theme preference:', err);
      } finally {
        if (isSubscribed) {
          setHasLoadedFromFirestore(true);
        }
      }
    };

    fetchUserTheme();
    return () => {
      isSubscribed = false;
    };
  }, [user]);

  // Save to Firestore when themePref changes and user is logged in
  useEffect(() => {
    if (!user) return;
    if (!hasLoadedFromFirestore) return;

    const saveThemeToFirestore = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { theme: themePref }, { merge: true });
      } catch (err) {
        console.error('Error saving user theme preference:', err);
      }
    };

    saveThemeToFirestore();
  }, [themePref, user, hasLoadedFromFirestore]);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (themePref === 'dark') {
        isDark = true;
      } else if (themePref === 'system') {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      try {
        localStorage.setItem('theme', themePref);
      } catch (e) {
        // Suppress redundant log
      }
    };

    applyTheme();

    const handleChange = () => {
      if (themePref === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePref]);

  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { textScale, setTextScale, autoAdjust, setAutoAdjust, highContrast, setHighContrast } = useTextScale();
  const [headerStyle, setHeaderStyle] = useState<'auto' | 'bold' | 'trans'>('auto');

  const cycleTextScale = () => {
    const currentIndex = TEXT_SCALE_CYCLE.indexOf(textScale);
    const nextIndex = (currentIndex + 1) % TEXT_SCALE_CYCLE.length;
    setTextScale(TEXT_SCALE_CYCLE[nextIndex]);
  };

  const toggleTheme = () => {
    triggerHaptic('medium');
    if (themePref === 'light') {
      setThemePref('dark');
    } else if (themePref === 'dark') {
      setThemePref('system');
    } else {
      setThemePref('light');
    }
  };

  const getThemeIcon = () => {
    if (themePref === 'dark') return <Moon className="w-3 sm:w-4 h-3 sm:h-4" fill="currentColor" />;
    if (themePref === 'system') return <Monitor className="w-3 sm:w-4 h-3 sm:h-4" />;
    return <Sun className="w-3 sm:w-4 h-3 sm:h-4" />;
  };

  const getHeaderBg = () => {
    if (headerStyle === 'bold') {
      return scrolled
        ? 'bg-slate-50 dark:bg-[#0b1329] shadow-md border-b border-slate-200/80 dark:border-white/10'
        : 'bg-slate-50/90 dark:bg-[#0b1329]/90 shadow-md border-b border-slate-200/60 dark:border-white/5';
    }
    if (headerStyle === 'trans') {
      return scrolled
        ? 'bg-slate-50 dark:bg-[#0b1329] shadow-md border-b border-slate-200/80 dark:border-white/10'
        : 'bg-transparent border-b border-transparent';
    }

    return scrolled
      ? 'bg-slate-50 dark:bg-[#0b1329] shadow-md border-b border-slate-200/80 dark:border-white/10'
      : 'bg-slate-50/90 dark:bg-[#0b1329]/90 shadow-md border-b border-slate-200/60 dark:border-white/5';
  };

  const headerBg = getHeaderBg();

  return (
    <header
      className={`w-full fixed top-0 left-0 right-0 z-[5000] backdrop-blur-xl smooth-header-transition ${headerBg} shadow-md h-[150px] sm:h-[170px] flex flex-col justify-start overflow-hidden pt-0`}
    >
      {/* Small, persistent 'Offline' visual banner */}
      {!isOnline && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-rose-500 dark:bg-rose-600 shadow-[0_1px_8px_rgba(244,63,94,0.6)] animate-pulse z-[5010]"
                  title={language === 'en' ? 'System offline' : 'प्रणाली अफलाइन'}
        />
      )}
       <div className="container mx-auto px-4 max-w-7xl">
         <div className="flex flex-col gap-0.5 sm:gap-1">
           <div className="flex items-center justify-between gap-2 sm:gap-4 h-12 sm:h-14">
             <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
               <motion.button
                 whileHover={{ scale: 1.06 }}
                 whileTap={{ scale: 0.94 }}
                 onClick={onOpenDrawer}
                 className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
                 title={language === 'en' ? 'Menu' : 'मेनु'}
               >
                 <Menu size={18} />
               </motion.button>
               <motion.div
                 whileHover={{ scale: 1.05 }}
                 className="relative shrink-0 flex items-center justify-center smooth-branding-transition w-8 h-8 sm:w-9 sm:h-9"
               >
                 <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-md">
                   <img
                     src="/GovtLogo.svg"
                     alt="Government of Nepal Logo"
                     className="w-[66%] h-[66%] object-contain drop-shadow-sm"
                     referrerPolicy="no-referrer"
                   />
                 </div>
                 {isOnline ? (
                   <span
                     className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-[#0c152e] bg-emerald-500 shadow-sm z-10 w-2 h-2"
                     title={language === 'en' ? 'System online' : 'प्रणाली अनलाइन'}
                   />
                 ) : (
                   <span
                     className="absolute -bottom-1 -right-1 w-3.5 h-3.5 z-10 flex items-center justify-center cursor-help"
                     title={language === 'en' ? 'System offline - changes saved to local cache' : 'प्रणाली अफलाइन - परिवर्तनहरू स्थानीय क्यासमा सुरक्षित छन्'}
                   >
                     <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 border border-white dark:border-[#0c152e] shadow-sm" />
                   </span>
                 )}
               </motion.div>

               <div className="relative flex flex-col justify-center min-w-0 flex-1">
                 <span className="font-display text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] font-black tracking-wide whitespace-nowrap text-brand-gradient uppercase leading-none truncate">
                   {language === 'ne' ? 'प्रगति ट्र्याकर' : APP_TITLES.shortAppName[language]}
                 </span>
                 <span className="text-[0.6rem] sm:text-[0.7rem] md:text-[0.75rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                   {language === 'en' ? 'Performance Overview' : 'कार्यसम्पादन अवलोकन'}
                 </span>
                 {fiscalYear && (
                   <span className="text-[0.65rem] sm:text-xs font-black text-[#0099DA] dark:text-[#00ADF7] bg-[#0099DA]/10 dark:bg-[#00ADF7]/10 px-1.5 py-0.5 rounded-md shrink-0 inline-block w-fit mt-0.5">
                     FY {fiscalYear}
                   </span>
                 )}
               </div>
             </div>
             <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Syncing Status */}
              <AnimatePresence>
                {pendingWrites.length > 0 && isOnline && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shadow-lg shadow-indigo-500/30 border border-indigo-400/60"
                  >
                    <CloudUpload size={11} className="animate-bounce sm:w-[13px] sm:h-[13px]" />
                    <span className="text-[0.6rem] sm:text-[0.7rem] font-extrabold tracking-tighter">
                      {pendingWrites.length}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl glass-panel"
                onMouseEnter={onMouseEnterFab}
                onMouseLeave={onMouseLeaveFab}
              >
                 {/* Theme Toggle Button */}
                 <motion.button
                   whileHover={{ scale: 1.06 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={toggleTheme}
                   className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 min-w-[32px] sm:min-w-[44px] min-h-[32px] sm:min-h-[44px] ${
                     themePref === 'dark'
                       ? 'bg-slate-900 text-amber-400 shadow'
                       : themePref === 'system'
                       ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                       : 'bg-white text-slate-900 dark:bg-white/10 dark:text-white shadow-sm'
                   }`}
                   title={language === 'en' ? `Theme: ${themePref}` : `थिम: ${themePref}`}
                 >
                   {getThemeIcon()}
                   <span className="text-[9px] sm:text-[10px] sm:hidden font-extrabold uppercase tracking-wider">{themePref[0].toUpperCase()}</span>
                   <span className="hidden sm:inline text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">{themePref}</span>
                 </motion.button>

                 {/* Language Toggle */}
                 <motion.button
                   whileHover={{ scale: 1.06 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={() => {
                     triggerHaptic('light');
                     setLanguage(language === 'ne' ? 'en' : 'ne');
                   }}
                   className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-brand-700 dark:text-brand-300 font-extrabold uppercase text-[9px] sm:text-[10px] sm:text-xs tracking-wider flex items-center justify-center gap-1 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10 min-w-[32px] sm:min-w-[44px] min-h-[32px] sm:min-h-[44px]"
                   title={language === 'en' ? 'Switch to Nepali' : 'अंग्रेजीमा स्विच गर्नुहोस्'}
                 >
                   <Languages size={14} className="sm:w-4 sm:h-4" />
                   <span className="sm:hidden">{language === 'en' ? 'N' : 'ने'}</span>
                   <span className="hidden sm:inline">{language === 'en' ? 'नेपाली' : 'EN'}</span>
                 </motion.button>

                 {/* Text Size (Cycle) */}
                 <motion.button
                   whileHover={{ scale: 1.06 }}
                   whileTap={{ scale: 0.94 }}
                   onClick={() => {
                     triggerHaptic('light');
                     cycleTextScale();
                   }}
                   className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all flex items-center justify-center bg-white dark:bg-white/10 border-transparent text-slate-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-white min-w-[32px] sm:min-w-[44px] min-h-[32px] sm:min-h-[44px]"
                   title={language === 'en' ? `Text Size: ${textScale}` : `पाठ आकार: ${textScale}`}
                 >
                   <Type size={14} className="sm:w-[18px] sm:h-[18px]" />
                 </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  };
