// bust-cache: force new bundle hash for PWA SW update
if (typeof console !== 'undefined') console.log('[DORPTS] build:' + Date.now());
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { TextScaleProvider } from "./hooks/useTextScale";
import { useHaptic } from "./hooks/useHaptic";
import { useShakeToRefresh } from "./hooks/useShakeToRefresh";
import { StartupScreen } from "./components/StartupScreen";
import { DataHealthModal } from "./components/DataHealthModal";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { RadialPerformanceChart } from "./components/RadialPerformanceChart";
import { IndicatorCard } from "./components/IndicatorCard";
import { IndicatorCommentsModal } from "./components/IndicatorCommentsModal";
import { BudgetUtilizationCard } from "./components/BudgetUtilizationCard";
import { IndicatorHistoryDrawer } from "./components/IndicatorHistoryDrawer";
import { ActivityDetailDrawer } from "./components/ActivityDetailDrawer";

import { PerformanceCorrelationHeatmap } from "./components/PerformanceCorrelationHeatmap";
import { KpiSummaryCard } from "./components/KpiSummaryCard";
import { KPISummaryChart } from "./components/KPISummaryChart";
import { PortfolioHealthChart } from "./components/PortfolioHealthChart";
import { IndicatorTable } from "./components/IndicatorTable";
import { MetricsChart } from "./components/MetricsChart";
import { TrendAnalysisView } from "./components/TrendAnalysisView";
import { VisualInsightsView } from "./components/VisualInsightsView";
import { ActionPortalView } from "./components/ActionPortalView";
import { ZoomableChartContainer } from "./components/ZoomableChartContainer";

import { InstitutionalView } from "./components/InstitutionalView";
import { QuickMetricsWidget } from "./components/QuickMetricsWidget";
import { AlertLogEntry } from "./components/AlertLog";
import { ViewMode, MainView, WidgetVisibility } from "./types";
import { NavigationMenu, NAV_ITEMS } from "./components/NavigationMenu";
import { LeftDrawerMenu } from "./components/LeftDrawerMenu";
import { BudgetModal } from "./components/BudgetModal";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { PrintLayout } from "./components/PrintLayout";
import { ReportBuilderModal } from "./components/ReportBuilderModal";
import { PrintConfirmDialog } from "./components/PrintConfirmDialog";
import { MapViewModal } from "./components/MapViewModal";
import { SystemHelpModal } from "./components/SystemHelpModal";
import { IndicatorHeatmap } from "./components/IndicatorHeatmap";
import { OfflineSummaryDashboard } from "./components/OfflineSummaryDashboard";
import { DashboardSummaryView } from "./components/DashboardSummaryView";
import { normalizeCategory, STANDARD_CATEGORIES, DEFAULT_CATEGORY_THEMES } from "./utils/category";
import { getFiscalYearForBsDateStr } from "./utils/bsDate";
import { API_BASE } from "./utils/apiBase";
import { fetchSheetData, fetchSpreadsheetMeta } from "./sheets";
import { syncPublishedSheets, buildCsvText } from "./utils/sheetSync";
import { useAuth } from "./context/AuthContext";
import { Indicator, SystemMetadata, Toast } from "./types";
import { APP_TITLES } from "./constants/appTitles";
import {
  parseGoogleSheetsCSV,
  DEFAULT_INDICATORS,
  setOfficesList,
} from "./data";
import { detectUserOffice } from "./utils/officeDetector";
import { ToastContainer } from "./components/ToastContainer";
import { VoiceUpdateModal } from "./components/VoiceUpdateModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FeedbackModal } from "./components/FeedbackModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { OfflineStatusBar } from "./components/OfflineStatusBar";
import { LoginScreen } from "./components/LoginScreen";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { SettingsPanelModal } from "./components/SettingsPanelModal";
import { motion, AnimatePresence } from "motion/react";
import { useDashboardLayout, useWidgetSpan } from "./hooks/useDashboardLayout";

import {
  Filter,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Gauge,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Mic,
  BarChart3,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  ArrowLeftRight,
  Scale,
  Target,
  TrendingUp,
  MicOff,
  Database,
  Map as MapIcon,
  Building2,
  Users,
  Wrench,
  Settings,
  LogOut,
  ShieldCheck,
  Shield,
  Menu,
} from "lucide-react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  getDoc,
  getDocs,
  setDoc,
  getDocFromServer,
  getDocsFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { HISTORICAL_DATA } from "./historicalData";
import { triggerHaptic } from "./utils/haptic";
import { speak } from "./utils/speech";
import { getStatusBadge } from "./utils/status";

const cardStaggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const cardStaggerItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -12,
    transition: { duration: 0.15 },
  },
};

const CustomTrendTooltip = ({ active, payload, language }: any) => {
  const lastActiveNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (active && payload && payload.length) {
      const currentName = payload[0].payload.name;
      if (lastActiveNameRef.current !== currentName) {
        lastActiveNameRef.current = currentName;
        triggerHaptic('light');
      }
    } else {
      lastActiveNameRef.current = null;
    }
  }, [active, payload]);

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xl shadow-indigo-500/10 min-w-[190px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {language === 'en' ? 'Milestone' : 'कोसेढुङ्गा'}
          </span>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-mono">
            {data.date}
          </span>
        </div>
        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
          {data.name}
        </h4>
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'Performance' : 'कार्यसम्पादन'}
          </span>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
            {data.score}%
          </span>
        </div>
        {/* Progress bar inside Tooltip */}
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
          <div 
            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${data.score}%` }}
          />
        </div>
      </div>
    );
  }
  return null;
};

const viewOrder: Record<MainView, number> = {
  dashboard: 0,
  insights: 1,
  institutional: 2,
  trends: 3,
  heatmap: 4,
  'action-portal': 5,
};

const viewVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    filter: 'blur(4px)',
  })
};

function MainAppContent() {
  const [pulseKey, setPulseKey] = useState(0);
  const [dashboardWidth, setDashboardWidth] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dashboardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDashboardWidth(entry.contentRect.width);
      }
    });
    observer.observe(dashboardRef.current);
    return () => observer.disconnect();
  }, []);

  const layout = useDashboardLayout(dashboardWidth);
  useHaptic();
  const { language, t, translateOffice, translateUnit } = useLanguage();
  const { accessToken, user, loading: authLoading, isAdmin, isSuperadmin, isDataUpdater, role, emailSession, logout, refreshAdmins, adminsList, userAssignedOffice } = useAuth();

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [showLogin, setShowLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'data_updater'>('admin');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [pwaDismissed, setPwaDismissed] = useState(() => sessionStorage.getItem('pwa-update-dismissed') === 'true');

  useEffect(() => {
    const handler = () => setPwaDismissed(true);
    window.addEventListener('pwa-banner-dismissed', handler);
    return () => window.removeEventListener('pwa-banner-dismissed', handler);
  }, []);

  const [appSettings, setAppSettings] = useState<{
    fiscalYear: string;
    sheetUrl: string;
    appNameEn: string;
    appNameNp: string;
    subHeaderEn: string;
    subHeaderNp: string;
    themeColor: string;
    sheetId: string;
    dashboardPublishedUrl: string;
    officesPublishedUrl: string;
  }>({
    fiscalYear: '2082/83',
    sheetUrl: '',
    appNameEn: APP_TITLES.appName.en,
    appNameNp: APP_TITLES.appName.ne,
    subHeaderEn: APP_TITLES.subHeader.en,
    subHeaderNp: APP_TITLES.subHeader.ne,
    themeColor: '#0099DA',
    sheetId: '1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM',
    dashboardPublishedUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=0',
    officesPublishedUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=40941786',
  });

  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2082/83');

  useEffect(() => {
    if (appSettings.fiscalYear) {
      setSelectedFiscalYear(appSettings.fiscalYear);
    }
  }, [appSettings.fiscalYear]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, 'settings', 'system');
        const snap = await getDoc(ref);
        if (snap.exists() && !cancelled) {
          const data = snap.data() as any;
          setAppSettings(prev => ({
            fiscalYear: data.fiscalYear || prev.fiscalYear,
            sheetUrl: data.sheetUrl || prev.sheetUrl,
            appNameEn: data.appNameEn || prev.appNameEn,
            appNameNp: data.appNameNp || prev.appNameNp,
            subHeaderEn: data.subHeaderEn || prev.subHeaderEn,
            subHeaderNp: data.subHeaderNp || prev.subHeaderNp,
            themeColor: data.themeColor || prev.themeColor,
            sheetId: data.sheetId || prev.sheetId,
            dashboardPublishedUrl: data.dashboardPublishedUrl || prev.dashboardPublishedUrl,
            officesPublishedUrl: data.officesPublishedUrl || prev.officesPublishedUrl,
          }));
        }
      } catch {
        // suppress
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const displayAppName = language === 'en' ? appSettings.appNameEn : appSettings.appNameNp;
    const displaySubHeader = language === 'en' ? appSettings.subHeaderEn : appSettings.subHeaderNp;
    if (typeof document !== 'undefined') {
      document.title = displayAppName;
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', appSettings.themeColor);
    }
    APP_TITLES.appName.en = appSettings.appNameEn;
    APP_TITLES.appName.ne = 'प्रगति ट्र्याकर';
    APP_TITLES.subHeader.en = appSettings.subHeaderEn;
    APP_TITLES.subHeader.ne = 'सम्पादन अनुगमन प्रणाली';
    APP_TITLES.shortAppName.en = appSettings.appNameEn.split(' ').slice(0, 2).join(' ') || 'DORPTS';
    APP_TITLES.shortAppName.ne = 'DORPTS';
  }, [appSettings, language]);

  const effectiveAppName = language === 'en' ? appSettings.appNameEn : appSettings.appNameNp;
  const effectiveSubHeader = language === 'en' ? appSettings.subHeaderEn : appSettings.subHeaderNp;

  const addToast = useCallback(
    (
      message: string,
      messageEn?: string,
      type: "success" | "info" | "error" | "warning" = "info",
      duration = 4500,
    ) => {
      const newToast: Toast = {
        id: String(Date.now() + Math.random()),
        message,
        messageEn,
        type,
        duration,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [dismissedOfflineDashboard, setDismissedOfflineDashboard] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissedOfflineDashboard(false);
      addToast(
        "सिङ्क्रोनाइजेसन सफल! स्थानीय क्यास लाईभ सडक विभाग डेटाबेससँग सिङ्क भयो।",
        "Local cache successfully synchronized with the live DoR database! Internet connection restored.",
        "success",
        5000,
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissedOfflineDashboard(false);
      addToast(
        "अफलाइन मोड सक्रिय छ। सबै परिवर्तनहरू स्थानीय क्यासमा सुरक्षित हुनेछन्।",
        "Offline mode active. Changes will save to local cache and sync when online.",
        "warning",
        5000,
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);

  const [metadata, setMetadata] = useState<SystemMetadata | null>({
    id: "current",
    lastUpdateDate: "2083/02/30",
    nextUpdateDate: "2083/03/07",
    totalWeight: 75,
    totalWeightProgress: 61,
  });

  const categoryThemes = useMemo(() => {
    return metadata?.categoryThemes || DEFAULT_CATEGORY_THEMES;
  }, [metadata]);

  const updateCategoryTheme = async (category: string, color: string) => {
    const newThemes = {
      ...categoryThemes,
      [category]: color
    };
    
    if (isAdmin) {
      try {
        const metaRef = doc(db, 'metadata', 'current');
        await setDoc(metaRef, { categoryThemes: newThemes }, { merge: true });
        addToast("Category theme updated globally.", "श्रेणी थिम विश्वव्यापी रूपमा अद्यावधिक गरियो।", "success");
      } catch (_) {
        console.error("Error updating category theme.");
        addToast("Error updating category theme.", "श्रेणी थिम अद्यावधिक गर्दा त्रुटि भयो।", "error");
      }
    } else {
       addToast("Only administrators can change category brand colors.", "प्रशासकहरूले मात्र श्रेणी ब्रान्ड रंगहरू परिवर्तन गर्न सक्छन्।", "warning");
    }
  };

  const handleUpdateSyncInterval = (interval: number) => {
    setSyncInterval(interval);
    localStorage.setItem("syncInterval", String(interval));
    window.dispatchEvent(new Event("syncIntervalChanged"));
  };

  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibility>({
    radialChart: true,
    summaryCards: true,
    trendsGraph: true,
    budgetUtilization: true,
    performanceHeatmap: true,
  });

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleToggleWidget = (key: keyof WidgetVisibility) => {
    setWidgetVisibility(prev => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const handleResetSettings = async () => {
    const defaults = {
      radialChart: true,
      summaryCards: true,
      trendsGraph: true,
      budgetUtilization: true,
      performanceHeatmap: true,
    };
    setWidgetVisibility(defaults);
    
    if (isAdmin) {
      try {
        const metaRef = doc(db, 'metadata', 'current');
        await setDoc(metaRef, { categoryThemes: DEFAULT_CATEGORY_THEMES }, { merge: true });
        addToast(
          language === "en" ? "Dashboard layout and themes reset to defaults." : "ड्यासबोर्ड सजावट र थिमहरू पूर्वावस्थामा फर्किए।",
          undefined,
          "success"
        );
      } catch (_) {
        console.error("Error resetting themes:");
        addToast(
          language === "en" ? "Layout reset, but failed to reset theme colors." : "सजावट रिसेट भयो, तर थिम रंगहरू रिसेट गर्न असफल भयो।",
          undefined,
          "error"
        );
      }
    } else {
      addToast(
        language === "en" ? "Widget visibility reset. Only admins can reset theme colors." : "विजेट दृश्यता रिसेट भयो। प्रशासकहरूले मात्र थिम रंगहरू रिसेट गर्न सक्छन्।",
        undefined,
        "info"
      );
    }
  };

  const viewOptions = [
    {
      id: "dashboard",
      label: t("dashboard") || "Dashboard",
      icon: <Gauge size={16} />,
    },
    {
      id: "card",
      label: t("cardView") || "Card View",
      icon: <LayoutGrid size={16} />,
    },
    {
      id: "chart",
      label: t("chartView") || "Chart View",
      icon: <BarChart3 size={16} />,
    },
    {
      id: "institutional",
      label: language === "en" ? "Institutional" : "संस्थागत",
      icon: <Layers size={16} />,
    },
    {
      id: "table",
      label: t("tableView") || "Table View",
      icon: <TableIcon size={16} />,
    },
    {
      id: "heatmap",
      label: t("heatmapView") || "Heatmap",
      icon: <Activity size={16} />,
    },
  ] as const;

  const [indicators, setIndicatorsRaw] = useState<Indicator[]>(() => {
    const isBlank = (val: any) => val === null || val === undefined || isNaN(Number(val)) || String(val).trim() === '';
    const seen = new Set<string>();
    return DEFAULT_INDICATORS
      .map(ind => {
        if (!ind) return ind;
        const annualTarget = isBlank(ind.annualTarget) ? 1 : ind.annualTarget;
        const annualProgress = isBlank(ind.annualProgress) ? 1 : ind.annualProgress;
        const totalTarget = isBlank(ind.totalTarget) ? 1 : ind.totalTarget;
        const totalProgress = isBlank(ind.totalProgress) ? 1 : ind.totalProgress;
        return {
          ...ind,
          annualTarget,
          annualProgress,
          totalTarget,
          totalProgress,
          category: normalizeCategory(ind.category)
        };
      })
      .filter((ind) => {
        if (!ind) return false;
        if (seen.has(ind.id)) return false;
        seen.add(ind.id);
        return true;
      });
  });

  const setIndicators = useCallback((newList: Indicator[] | ((prev: Indicator[]) => Indicator[])) => {
    setIndicatorsRaw(prev => {
      const updatedList = typeof newList === 'function' ? newList(prev) : newList;
      const isBlank = (val: any) => val === null || val === undefined || isNaN(Number(val)) || String(val).trim() === '';
      let normalized = updatedList.map(ind => {
        if (!ind) return ind;
        const annualTarget = isBlank(ind.annualTarget) ? 1 : ind.annualTarget;
        const annualProgress = isBlank(ind.annualProgress) ? 1 : ind.annualProgress;
        const totalTarget = isBlank(ind.totalTarget) ? 1 : ind.totalTarget;
        const totalProgress = isBlank(ind.totalProgress) ? 1 : ind.totalProgress;
        return {
          ...ind,
          annualTarget,
          annualProgress,
          totalTarget,
          totalProgress,
          category: normalizeCategory(ind.category)
        };
      });
      const seen = new Set<string>();
      normalized = normalized.filter((ind) => {
        if (!ind) return false;
        if (seen.has(ind.id)) return false;
        seen.add(ind.id);
        return true;
      });
      return normalized;
    });
  }, []);
  const [alertLogs, setAlertLogs] = useState<AlertLogEntry[]>([]);

  const checkAndLogThresholdBreaches = useCallback(
    (currentIndicators: Indicator[], currentLogs: AlertLogEntry[]) => {
      let updated = false;
      const nextLogs = [...currentLogs];

      currentIndicators.forEach((ind) => {
        const threshold = 80;
        const progressPercent =
          ind.annualTarget > 0
            ? Math.round((ind.annualProgress / ind.annualTarget) * 100)
            : 0;

        if (progressPercent <= threshold) {
          const alreadyLogged = nextLogs.some(
            (log) =>
              log.indicatorId === ind.id &&
              log.progress === progressPercent &&
              log.threshold === threshold,
          );

          if (!alreadyLogged) {
            const newLog: AlertLogEntry = {
              id: `alert-log-${Date.now()}-${ind.id}-${Math.random().toString(36).substr(2, 5)}`,
              indicatorId: ind.id,
              indicatorName: ind.name,
              indicatorNameEn: ind.nameEn || ind.name,
              category: ind.category || "Infrastructure Creation",
              threshold,
              progress: progressPercent,
              timestamp: new Date().toISOString(),
            };
            nextLogs.unshift(newLog);
            updated = true;
          }
        }
      });

      if (updated) {
        return nextLogs;
      }
      return null;
    },
    [],
  );

  const handleThresholdChange = useCallback(() => {
    setTimeout(() => {
      setAlertLogs((prevLogs) => {
        const next = checkAndLogThresholdBreaches(indicators, prevLogs);
        return next || prevLogs;
      });
    }, 50);
  }, [indicators, checkAndLogThresholdBreaches]);

  const handleClearAlertLogs = useCallback(() => {
    setAlertLogs([]);
  }, []);

  useEffect(() => {
    setAlertLogs((prevLogs) => {
      const next = checkAndLogThresholdBreaches(indicators, prevLogs);
      return next || prevLogs;
    });
  }, [indicators, checkAndLogThresholdBreaches]);

  const [isQuickSortOpen, setIsQuickSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<"default" | "low" | "high" | "weight" | "status">("default");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedOffice, setSelectedOffice] = useState<string>("All");
  const [hasAutoDetectedOffice, setHasAutoDetectedOffice] = useState(false);
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [isDataHealthModalOpen, setIsDataHealthModalOpen] = useState(false);
  const [healthRetryKey, setHealthRetryKey] = useState(0);
  const [selectedCommentsIndicator, setSelectedCommentsIndicator] = useState<Indicator | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isAllCardsExpanded, setIsAllCardsExpanded] = useState(false);
  const [expandedHeatmapCategory, setExpandedHeatmapCategory] = useState<string | null>(null);
  const [heatmapSearchQuery, setHeatmapSearchQuery] = useState("");
  const [dashboardSubTab, setDashboardSubTab] = useState<"trends" | "diagnostics" | "offices">("trends");

  useEffect(() => {
    if (hasAutoDetectedOffice) return;

    let isMounted = true;

    async function performOfficeDetection() {
      const result = await detectUserOffice(user?.email);
      if (!isMounted) return;

      if (result.office) {
        setSelectedOffice(result.office);
        setHasAutoDetectedOffice(true);
        addToast(
          `स्वचालित रूपमा स्थानीय कार्यालय पहिचान भयो: ${result.office}`,
          `Automatically detected and set filter for your DoR office: ${result.office} (${result.method === 'email' ? 'via login email' : result.method === 'gps' ? 'via location coordinates' : 'via network IP'})`,
          "success",
          6000
        );
      } else {
        setHasAutoDetectedOffice(true); // Don't retry continuously
      }
    }

    if (!authLoading) {
      performOfficeDetection();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, hasAutoDetectedOffice, addToast]);

  useEffect(() => {
    if (!userAssignedOffice || isSuperadmin) return;
    if (selectedOffice !== userAssignedOffice) {
      setSelectedOffice(userAssignedOffice);
    }
  }, [userAssignedOffice, isSuperadmin, selectedOffice]);

  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState<{ 
    name: string; 
    updated: string; 
    avgCompletion?: number; 
    total?: number; 
    onTrack?: number; 
    attention?: number; 
    stale?: number; 
  }[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("dor_offices_cache");
          if (saved) {
            return JSON.parse(saved);
          }
        } catch (_) {
          // Suppress redundant log
        }
      }
      return [];
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("dor_offices_cache");
      if (saved) {
        const parsed = JSON.parse(saved);
        setOfficesList(parsed);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    triggerHaptic("medium");

    const processIndicators = (parsedList: any[], parsedMeta: any) => {
      if (parsedList && parsedList.length > 0) {
        setIndicators(parsedList);
        setMetadata(parsedMeta);
        try {
          localStorage.setItem("dor_indicators_cache", JSON.stringify(parsedList));
          localStorage.setItem("dor_metadata_cache", JSON.stringify(parsedMeta));
        } catch (_) {
          // Suppress redundant log
        }
      }
    };

    const processOffices = (rows: any[][]) => {
      let officeColIdx = 1;
      let headerRowIdx = -1;
      let totalRowValues: number[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (
          row &&
          row.some((val: any) => {
            const s = String(val).toLowerCase();
            return s.includes("office") || s.includes("कार्यालय");
          })
        ) {
          headerRowIdx = i;
          officeColIdx = row.findIndex((val: any) => {
            const s = String(val).toLowerCase();
            return s.includes("office") || s.includes("कार्यालय");
          });
          if (officeColIdx === -1) officeColIdx = 1;
          break;
        }
      }
      const parsedOffices: { name: string; updated: string; avgCompletion?: number; total?: number }[] = [];
      const startRowIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      for (let i = startRowIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length <= officeColIdx) continue;
        const officeName = String(row[officeColIdx] || "").trim();
        if (
          officeName &&
          officeName !== "Total" &&
          officeName !== "कुल" &&
          !officeName.toLowerCase().includes("note:") &&
          !officeName.includes("To be updated") &&
          !officeName.startsWith("=") &&
          officeName.length > 3
        ) {
          parsedOffices.push({ name: officeName, updated: "Updated recently" });
        }
        if (officeName === "Total" || officeName === "कुल") {
          totalRowValues = row.map((val: any) => {
            const num = parseFloat(String(val || "").replace(/,/g, ""));
            return isNaN(num) ? 0 : num;
          });
        }
      }
      if (totalRowValues.length > 0 && parsedOffices.length > 0) {
        parsedOffices.forEach((office) => {
          const officeRow = rows.find((r: any[]) => {
            const name = String(r[officeColIdx] || "").trim();
            return name === office.name;
          });
          if (!officeRow) return;
          let sumCompletion = 0;
          let count = 0;
          for (let c = officeColIdx + 1; c < Math.min(officeRow.length, totalRowValues.length); c++) {
            const totalVal = totalRowValues[c];
            const officeVal = parseFloat(String(officeRow[c] || "").replace(/,/g, ""));
            if (!isNaN(officeVal) && totalVal > 0) {
              sumCompletion += Math.min(100, (officeVal / totalVal) * 100);
              count++;
            }
          }
          if (count > 0) {
            office.avgCompletion = Math.round(sumCompletion / count);
            office.total = count;
          }
        });
      }
      if (parsedOffices.length > 0) {
        setOffices(parsedOffices);
        setOfficesList(parsedOffices);
        try {
          localStorage.setItem("dor_offices_cache", JSON.stringify(parsedOffices));
        } catch (_) {
          // Suppress redundant log
        }
      }
    };

    const computeSheetUpdates = (indicators: any[]) => {
      const sorted = indicators
        .filter((i) => i.updatedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20);

      return sorted.map((ind, idx) => ({
        id: `sheet_${ind.id || idx}_${Date.now()}`,
        lastUpdateDate: ind.updatedAt,
        metadata: { updatedBy: ind.updatedBy },
        indicators: [ind],
        isSheetEntry: true,
      }));
    };

    const done = (parsedList: any[]) => {
      setLoading(false);
      setPulseKey((prev) => prev + 1);
      setHealthRetryKey((prev) => prev + 1);
      if (parsedList && parsedList.length > 0) {
        setSheetUpdates(computeSheetUpdates(parsedList));
      }
    };

    if (!accessToken) {
      syncPublishedSheets({
        dashboard: appSettings.dashboardPublishedUrl,
        offices: appSettings.officesPublishedUrl,
      })
        .then((fallback) => {
          processIndicators(fallback.indicators, fallback.metadata);
          if (fallback.offices.length > 0) {
            setOffices(fallback.offices);
            setOfficesList(fallback.offices);
            try {
              localStorage.setItem("dor_offices_cache", JSON.stringify(fallback.offices));
            } catch (_) {
              // ignore
            }
          }
          done(fallback.indicators);
        })
        .catch((fallbackErr) => {
          console.error("Published CSV sync failed:", fallbackErr);
          done([]);
        });
      return;
    }

    fetchSpreadsheetMeta(
      appSettings.sheetId || "1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM",
      accessToken,
    )
      .then((meta) => {
        const dashboardTabId = appSettings.dashboardTabId || "0";
        const officesTabId = appSettings.officesTabId || "40941786";
        const sheet0 =
          meta.sheets?.find(
            (s: any) => String(s.properties.sheetId) === dashboardTabId,
          ) || meta.sheets?.[0];
        const sheetOffices = meta.sheets?.find(
          (s: any) => String(s.properties.sheetId) === officesTabId,
        );
        const title0 = sheet0 ? sheet0.properties.title : "सडक विभाग प्रगति Dashboard";
        const titleOffices = sheetOffices
          ? sheetOffices.properties.title
          : "To be updated Every Week_Cumulative";

        return Promise.all([
          fetchSheetData(
            appSettings.sheetId || "1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM",
            `${title0}!A1:Z250`,
            accessToken,
          ),
          fetchSheetData(
            appSettings.sheetId || "1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM",
            `${titleOffices}!A1:Z250`,
            accessToken,
          ),
        ]);
      })
      .then(([data0, dataOffices]) => {
        let parsedList: any[] = [];
        if (data0.values) {
          const csvText0 = buildCsvText(data0.values);
          const { indicators, metadata } = parseGoogleSheetsCSV(csvText0);
          parsedList = indicators;
          processIndicators(indicators, metadata);
        }
        if (dataOffices.values) {
          processOffices(dataOffices.values);
        }
        done(parsedList);
      })
      .catch(async (err) => {
        console.error("Authenticated fetch failed, falling back to published CSV:", err);
        try {
          const fallback = await syncPublishedSheets({
            dashboard: appSettings.dashboardPublishedUrl,
            offices: appSettings.officesPublishedUrl,
          });
          processIndicators(fallback.indicators, fallback.metadata);
          if (fallback.offices.length > 0) {
            setOffices(fallback.offices);
            setOfficesList(fallback.offices);
            try {
              localStorage.setItem("dor_offices_cache", JSON.stringify(fallback.offices));
            } catch (_) {
              // ignore
            }
          }
          done(fallback.indicators);
          return;
        } catch (fallbackErr) {
          console.error("Fallback CSV sync also failed:", fallbackErr);
        }
        done([]);
      });
  }, [accessToken]);

  useShakeToRefresh(fetchData);

  useEffect(() => {
    fetchData();
  }, [accessToken, fetchData]);

  const [syncInterval, setSyncInterval] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("syncInterval");
        const parsed = saved ? parseInt(saved) : 5;
        return [5, 15, 30, 60, 120].includes(parsed) ? parsed : 5;
      } catch (_) {
        return 5;
      }
    }
    return 5;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("syncInterval");
      const parsed = saved ? parseInt(saved) : 5;
      if (![5, 15, 30, 60, 120].includes(parsed)) {
        localStorage.setItem("syncInterval", "5");
        setSyncInterval(5);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const intervalMs = syncInterval * 60 * 1000;
    const timer = setInterval(() => {
      fetchData();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [syncInterval, fetchData, accessToken]);

  useEffect(() => {
    const handleSyncChange = () => {
      const interval = localStorage.getItem("syncInterval");
      setSyncInterval(interval ? parseInt(interval) : 30);
    };
    window.addEventListener("syncIntervalChanged", handleSyncChange);
    return () => window.removeEventListener("syncIntervalChanged", handleSyncChange);
  }, []);
  const [isHoveringAbout, setIsHoveringAbout] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [highlightedCard, setHighlightedCard] = useState<'insights' | null>(null);

  const [direction, setDirection] = useState(0);
  const [portfolioHealthMode, setPortfolioHealthMode] = useState<'bar' | 'pie'>('bar');

  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSuccessTrigger, setVoiceSuccessTrigger] = useState(false);
  const globalRecognitionRef = useRef<any>(null);

  const speakFeedback = (textToSpeak: string) => {
    speak(textToSpeak, language);
  };

  const processVoiceCommand = (text: string) => {
    const normalized = text.toLowerCase().trim();
    const isEn = language === "en";

    let matchedView: ViewMode | null = null;
    let matchedChartSubView: "performance" | "trend" | null = null;
    let viewFeedbackEn = "";
    let viewFeedbackNp = "";

    if (
      normalized.includes("table view") ||
      normalized.includes("show table") ||
      normalized.includes("go to table") ||
      normalized === "table" ||
      normalized.includes("टेबल") ||
      normalized.includes("तालिका")
    ) {
      matchedView = "table";
      viewFeedbackEn = "Switching to Table View.";
      viewFeedbackNp = "तालिका दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("card view") ||
      normalized.includes("show card") ||
      normalized.includes("go to card") ||
      normalized === "card" ||
      normalized.includes("कार्ड")
    ) {
      matchedView = "card";
      viewFeedbackEn = "Switching to Card View.";
      viewFeedbackNp = "कार्ड दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("trend analysis") ||
      normalized.includes("trend view") ||
      normalized.includes("show trends") ||
      normalized.includes("go to trends") ||
      normalized === "trends" ||
      normalized.includes("प्रवृत्ति विश्लेषण") ||
      normalized.includes("प्रवृत्ति")
    ) {
      matchedView = "chart";
      matchedChartSubView = "trend";
      viewFeedbackEn = "Switching to Trend Analysis View.";
      viewFeedbackNp = "प्रवृत्ति विश्लेषण दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("annual performance") ||
      normalized.includes("performance view") ||
      normalized.includes("show performance") ||
      normalized.includes("performance") ||
      normalized.includes("वार्षिक कार्यसम्पादन") ||
      normalized.includes("कार्यसम्पादन")
    ) {
      matchedView = "chart";
      matchedChartSubView = "performance";
      viewFeedbackEn = "Switching to Annual Performance View.";
      viewFeedbackNp = "वार्षिक कार्यसम्पादन दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("chart view") ||
      normalized.includes("show chart") ||
      normalized.includes("go to chart") ||
      normalized === "chart" ||
      normalized.includes("चार्ट")
    ) {
      matchedView = "chart";
      viewFeedbackEn = "Switching to Chart View.";
      viewFeedbackNp = "चार्ट दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("heatmap view") ||
      normalized.includes("show heatmap") ||
      normalized.includes("go to heatmap") ||
      normalized.includes("heat map") ||
      normalized === "heatmap" ||
      normalized.includes("हिटम्याप") ||
      normalized.includes("हिट म्याप")
    ) {
      matchedView = "heatmap";
      viewFeedbackEn = "Switching to Heatmap View.";
      viewFeedbackNp = "हिटम्याप दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("dashboard view") ||
      normalized.includes("show dashboard") ||
      normalized.includes("go to dashboard") ||
      normalized === "dashboard" ||
      normalized.includes("ड्यासबोर्ड")
    ) {
      matchedView = "dashboard";
      viewFeedbackEn = "Switching to Dashboard View.";
      viewFeedbackNp = "ड्यासबोर्ड दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("office view") ||
      normalized.includes("show office") ||
      normalized.includes("go to office") ||
      normalized.includes("office") ||
      normalized.includes("offices") ||
      normalized === "office" ||
      normalized.includes("कार्यालय")
    ) {
      matchedView = "institutional";
      viewFeedbackEn = "Switching to Offices View.";
      viewFeedbackNp = "कार्यालय दृश्यमा जाँदैछ।";
    } else if (
      normalized.includes("data health") ||
      normalized.includes("health view") ||
      normalized.includes("show health") ||
      normalized.includes("health") ||
      normalized.includes("स्वास्थ्य") ||
      normalized.includes("डाटा स्वास्थ्य")
    ) {
      matchedView = "institutional";
      viewFeedbackEn = "Switching to Offices & Health.";
      viewFeedbackNp = "कार्यालय र स्वास्थ्य विवरणमा जाँदैछ।";
    } else if (
      normalized.includes("generate report") ||
      normalized.includes("create report") ||
      normalized.includes("make report") ||
      normalized.includes("print report") ||
      normalized.includes("प्रतिवेदन") ||
      normalized.includes("रिपोर्ट")
    ) {
      const generatingMsg = isEn 
        ? "Generating executive report with AI summary..." 
        : "एआई सारांश सहितको कार्यकारी प्रतिवेदन तयार गर्दै...";
      setVoiceFeedback(generatingMsg);
      speakFeedback(generatingMsg);
      addToast(generatingMsg, generatingMsg, "info");
      
      generateAIReport();

      setTimeout(() => {
        setIsListeningVoice(false);
        setVoiceFeedback(null);
        setVoiceError(null);
      }, 2000);
      
      return;
    }

    if (matchedView) {
      setViewMode(matchedView);
      if (matchedChartSubView) {
        setChartSubView(matchedChartSubView);
      }
      const confirmationMsg = isEn ? viewFeedbackEn : viewFeedbackNp;
      setVoiceFeedback(confirmationMsg);
      speakFeedback(confirmationMsg);
      triggerHaptic("success");
      addToast(confirmationMsg, confirmationMsg, "success");
      setVoiceSuccessTrigger(true);
      setTimeout(() => setVoiceSuccessTrigger(false), 1500);

      // Auto close listening state on success
      setTimeout(() => {
        setIsListeningVoice(false);
        setVoiceFeedback(null);
        setVoiceError(null);
      }, 2000);
      return;
    }

    const fallbackMsg = isEn
      ? `Not recognized: "${text}". Try: table, card, chart, trend, heatmap, dashboard, offices, report.`
      : `चिनिएन: "${text}"। प्रयास गर्नुहोस्: table, card, chart, trend, heatmap, dashboard, offices, report.`;
    setVoiceError(fallbackMsg);
    speakFeedback(fallbackMsg);
  };

  const toggleGlobalVoiceListening = () => {
    triggerHaptic("medium");
    setVoiceError(null);
    setVoiceFeedback(null);

    if (isListeningVoice) {
      if (globalRecognitionRef.current) {
        try {
          globalRecognitionRef.current.stop();
        } catch {
          console.error("Failed to stop voice recognition:");
        }
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg =
        language === "en"
          ? "Speech recognition is not supported in this browser."
          : "तपाईँको ब्राउजरमा आवाज पहिचान सेवा उपलब्ध छैन।";
      setVoiceError(msg);
      speakFeedback(msg);
      return;
    }

    const recognition = new SpeechRecognition();
    globalRecognitionRef.current = recognition;
    recognition.lang = language === "ne" ? "ne-NP" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningVoice(true);
      setVoiceError(null);
    const startMsg =
      language === "en"
        ? "Listening... Try: table, chart, heatmap, dashboard, offices, report."
        : "सुन्दैछ... जस्तै: table, chart, heatmap, dashboard, offices, report भन्नुहोस्।";
    setVoiceFeedback(startMsg);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results?.[0]?.[0]?.transcript || '';
      transcript = transcript.replace(/[.,?!]+$/, "").trim();
      setVoiceFeedback(
        language === "en" ? `Heard: "${transcript}"` : `सुनियो: "${transcript}"`
      );
      processVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Voice navigation error:", event.error);
      setIsListeningVoice(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          language === "en"
            ? "Microphone access denied. Please enable mic permissions."
            : "माइक पहुँच अस्वीकार गरियो। कृपया सेटिङमा अनुमति दिनुहोस्।"
        );
      } else if (event.error === "no-speech") {
        setVoiceError(
          language === "en"
            ? "No speech detected. Please try again."
            : "कुनै आवाज सुनिएन। कृपया फेरि प्रयास गर्नुहोला।"
        );
      } else {
        setVoiceError(
          language === "en"
            ? `Speech recognition failed: ${event.error}`
            : `आवाज पहिचान असफल भयो: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    try {
      recognition.start();
    } catch {
      console.error("Failed to start voice recognition:");
    }
  };



  useEffect(() => {
    setSearchQuery("");
  }, [viewMode, categoryFilter, selectedOffice]);
  const [chartSubView, setChartSubView] = useState<"performance" | "trend">(
    "performance",
  );
  const handleMainViewChange = useCallback((view: MainView) => {
    if (view === mainView) return;

    const newDirection = viewOrder[view] - viewOrder[mainView];
    setDirection(newDirection);
    setMainView(view);
    triggerHaptic('light');

    if (view === 'dashboard') {
      setViewMode('dashboard');
    } else if (view === 'institutional') {
      setViewMode('institutional');
    } else if (view === 'trends') {
      setViewMode('chart');
      setChartSubView('trend');
    } else if (view === 'heatmap') {
      setViewMode('heatmap');
    } else if (view === 'action-portal') {
      setViewMode('dashboard');
    }
  }, [mainView]);

  const goToIndicators = useCallback(() => {
    setMainView('dashboard');
    setViewMode('card');
    setIsDrawerOpen(false);
  }, []);

  const goToVisualInsights = useCallback(() => {
    handleMainViewChange('insights');
    setIsDrawerOpen(false);
  }, []);

  const handleViewChange = useCallback((view: ViewMode | "trend") => {
    setSearchQuery(""); // Clear search history/query on view change
    setCategoryFilter("All");
    setSelectedOffice("All");
    setSortType("default");
    setShowMilestonesOnly(false);
    
    let targetView = view;
    if (view === 'data-health') {
      targetView = 'institutional';
    }

    if (targetView === "trend") {
      setMainView('trends');
      setViewMode("chart");
      setChartSubView("trend");
    } else {
      if (targetView === 'dashboard' || ['card', 'table', 'chart'].includes(targetView as string)) {
        setMainView('dashboard');
      } else if (targetView === 'heatmap') {
        setMainView('heatmap');
      } else if (['institutional', 'compare', 'unified'].includes(targetView as string)) {
        setMainView('institutional');
      }

      setViewMode(targetView as ViewMode);
      if (targetView === "chart") {
        setChartSubView("performance");
      }
    }
  }, []);
  const [distributionViewMode, setDistributionViewMode] = useState<"list" | "donut" | "bar" | "radial">("bar");
  const [updatesHistory, setUpdatesHistoryRaw] = useState<any[]>([]);
  const [sheetUpdates, setSheetUpdates] = useState<any[]>([]);

  const visibleHistory = useMemo(() => {
    if (!selectedFiscalYear || !updatesHistory.length) return updatesHistory;
    return updatesHistory.filter(item => {
      const itemFY = getFiscalYearForBsDateStr(item.lastUpdateDate || item.id || '');
      if (!itemFY) return true;
      return itemFY >= selectedFiscalYear;
    });
  }, [updatesHistory, selectedFiscalYear]);

  const setUpdatesHistory = useCallback((newHistory: any[] | ((prev: any[]) => any[])) => {
    setUpdatesHistoryRaw(prev => {
      const updated = typeof newHistory === 'function' ? newHistory(prev) : newHistory;
      return updated.map(item => ({
        ...item,
        indicators: item.indicators?.map((ind: any) => ({
          ...ind,
          category: normalizeCategory(ind.category)
        }))
      }));
    });
  }, []);
  const [pendingWrites, setPendingWrites] = useState<Indicator[]>([]);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isOfflineQueueDismissed, setIsOfflineQueueDismissed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedHistoryIndicator, setSelectedHistoryIndicator] =
    useState<Indicator | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedActivityEntry, setSelectedActivityEntry] = useState<
    any | null
  >(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const handleSelectActivityEntry = useCallback((entry: any) => {
    setSelectedActivityEntry(entry);
    setIsActivityDrawerOpen(true);
  }, []);

  const handleOpenLatestActivity = useCallback(() => {
    if (updatesHistory && updatesHistory.length > 0) {
      setSelectedActivityEntry(updatesHistory[0]);
      setIsActivityDrawerOpen(true);
    }
  }, [updatesHistory]);

  // AUTOMATED ALERTS: Tracked indicators persistence
  const [trackedIds, setTrackedIds] = useState<string[]>([]);

  const toggleTrack = useCallback((id: string) => {
    setTrackedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOnline && pendingWrites.length > 0) {
      setIsOfflineQueueDismissed(false);
    }
  }, [isOnline, pendingWrites.length]);

  const hasSpokenHealthStatus = useRef(false);

  useEffect(() => {
    if (indicators.length > 0 && !hasSpokenHealthStatus.current) {
      let belowThresholdCount = 0;
      const threshold = 80;
      indicators.forEach((ind) => {
        const progressPercent =
          ind.annualTarget > 0
            ? Math.round((ind.annualProgress / ind.annualTarget) * 100)
            : 0;
        if (progressPercent <= threshold) {
          belowThresholdCount++;
        }
      });

      if (belowThresholdCount > 0) {
        const message = `Warning: ${belowThresholdCount} indicator${belowThresholdCount > 1 ? 's are' : ' is'} currently below your target threshold.`;
        speak(message, language);
      }
      hasSpokenHealthStatus.current = true;
    }
  }, [indicators]);

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [lastSeenUpdate, setLastSeenUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (metadata?.lastUpdateDate) {
      if (!lastSeenUpdate) {
        setLastSeenUpdate(metadata.lastUpdateDate);
      } else if (metadata.lastUpdateDate !== lastSeenUpdate) {
        setHasNewUpdate(true);
      }
    }
  }, [metadata?.lastUpdateDate, lastSeenUpdate]);

  const pullDistanceRef = React.useRef(0);
  const isSyncingRef = React.useRef(false);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const handleIndicatorClick = (indicator: Indicator) => {
    setSearchQuery(""); // Auto delete search history on navigate to content
    setSelectedIndicatorId(indicator.id);
    setAboutModalTab("indicators");
    setIsAboutModalOpen(true);
  };

  const handleOpenComments = (indicator: Indicator) => {
    setSelectedCommentsIndicator(indicator);
    setIsCommentsModalOpen(true);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    let isOfflineFallback = !isOnline;
    try {
      // 1. Force fetch metadata or fallback to cached snapshot
      let metadataSnap;
      if (isOfflineFallback) {
        metadataSnap = await getDoc(doc(db, "metadata", "current"));
      } else {
        try {
          metadataSnap = await getDocFromServer(doc(db, "metadata", "current"));
        } catch (_) {
          console.warn("getDocFromServer failed, falling back to cached getDoc:");
          isOfflineFallback = true;
          metadataSnap = await getDoc(doc(db, "metadata", "current"));
        }
      }

      if (metadataSnap.exists()) {
        const data = metadataSnap.data() as SystemMetadata;
        setMetadata(data);
        if (data.lastUpdateDate) {
          setLastSeenUpdate(data.lastUpdateDate);
          localStorage.setItem("dor_last_seen_update", data.lastUpdateDate);
          setHasNewUpdate(false);
        }
        try {
          localStorage.setItem("dor_metadata_cache", JSON.stringify(data));
        } catch (_) {
          // Suppress redundant log
        }
      }

      // 2. Force fetch indicators or fallback to cached snapshot
      const q = query(collection(db, "indicators"), orderBy("id"));
      let indicatorsSnap;
      if (isOfflineFallback) {
        indicatorsSnap = await getDocs(q);
      } else {
        try {
          indicatorsSnap = await getDocsFromServer(q);
        } catch (_) {
          console.warn("getDocsFromServer failed, falling back to cached getDocs:");
          isOfflineFallback = true;
          indicatorsSnap = await getDocs(q);
        }
      }

      if (!indicatorsSnap.empty) {
        const list: Indicator[] = [];
        indicatorsSnap.forEach((d) => {
          list.push(d.data() as Indicator);
        });
        setIndicators(list);
        try {
          localStorage.setItem("dor_indicators_cache", JSON.stringify(list));
        } catch (_) {
          // Suppress redundant log
        }
      }

      // 3. Force fetch history or fallback to cached snapshot
      const qHistory = query(
        collection(db, "updates_history"),
        orderBy("id", "desc"),
      );
      let historySnap;
      if (isOfflineFallback) {
        historySnap = await getDocs(qHistory);
      } else {
        try {
          historySnap = await getDocsFromServer(qHistory);
        } catch (_) {
          console.warn("getDocsFromServer for history failed, falling back to cached getDocs:");
          isOfflineFallback = true;
          historySnap = await getDocs(qHistory);
        }
      }

      const history: any[] = [];
      historySnap.forEach((d) => history.push(d.data()));
      setUpdatesHistory(history);

      // Always refresh from published Sheets so Sync reflects Sheet edits too
      try {
        const published = await syncPublishedSheets({
          dashboard: appSettings.dashboardPublishedUrl,
          offices: appSettings.officesPublishedUrl,
        });
        if (published.indicators.length > 0) {
          setIndicators(published.indicators);
          setMetadata(published.metadata);
          try {
            localStorage.setItem("dor_indicators_cache", JSON.stringify(published.indicators));
            localStorage.setItem("dor_metadata_cache", JSON.stringify(published.metadata));
          } catch (_) {}
        }
        if (published.offices.length > 0) {
          setOffices(published.offices);
          setOfficesList(published.offices);
          try {
            localStorage.setItem("dor_offices_cache", JSON.stringify(published.offices));
          } catch (_) {}
        }
        const newSheetUpdates = published.indicators
          .filter((i: any) => i.updatedAt)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20)
          .map((ind: any, idx: number) => ({
            id: `sheet_${ind.id || idx}_${Date.now()}`,
            lastUpdateDate: ind.updatedAt,
            metadata: { updatedBy: ind.updatedBy },
            indicators: [ind],
            isSheetEntry: true,
          }));
        setSheetUpdates(newSheetUpdates);
        setHealthRetryKey((prev) => prev + 1);
      } catch (publishedErr) {
        console.error("Published Sheets sync failed:", publishedErr);
      }

      try {
        localStorage.setItem(
          "dor_last_sync_timestamp",
          new Date().toISOString(),
        );
      } catch (_) {
        // Suppress redundant log
      }

      if (isOfflineFallback) {
        addToast(
          language === "en"
            ? "Sync Complete (Offline Mode)"
            : "सिङ्क सम्पन्न (अफलाइन मोड)",
          language === "en"
            ? "Using cached local database snapshot. Data will fully synchronize when online."
            : "सुरक्षित स्थानीय डाटा देखाइएको छ। अनलाइन भएपछि पूर्ण सिंक्रोनाइज हुनेछ।",
          "warning",
        );
      } else {
        addToast(
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          language === "en"
            ? "Data successfully re-synchronized with server"
            : "डाटा सर्भरसँग सफलतापूर्वक पुन: सिंक्रोनाइज गरियो",
          "success",
        );
      }
      setPulseKey((prev) => prev + 1);
    } catch (error) {
      console.error("Manual re-sync failed:", error);
      addToast(
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        language === "en"
          ? "Sync failed. Please check your internet connection."
          : "सिङ्क असफल भयो। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-Retry Sync when connection is restored
  const prevIsOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (isOnline && !prevIsOnlineRef.current && pendingWrites.length > 0) {
      handleManualSync();
    }
    prevIsOnlineRef.current = isOnline;
  }, [isOnline, pendingWrites.length]);

  useEffect(() => {
    let startY = 0;
    let pulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only pull to refresh if we are scrolled to the very top
      if (
        window.scrollY <= 1 &&
        e.touches.length === 1 &&
        !isSyncingRef.current
      ) {
        startY = e.touches[0].clientY;
        pulling = true;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      // Only handle pull if we are dragging down
      if (diff > 0 && window.scrollY <= 1) {
        // Apply smooth resistance logarithmic/multiplied
        const distance = Math.min(diff * 0.45, 120);
        setPullDistance(distance);

        // Prevent default browser rubber-banding/scroll-pull-down actions
        if (diff > 15 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        // Dragging up or scrolled down, reset pulling state
        setPullDistance(0);
        pulling = false;
        setIsPulling(false);
      }
    };

    const handleTouchEnd = () => {
      if (!pulling) return;
      pulling = false;
      setIsPulling(false);

      if (pullDistanceRef.current > 55 && !isSyncingRef.current) {
        handleManualSync();
      }
      setPullDistance(0);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printIndicators, setPrintIndicators] = useState<Indicator[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportShowSummary, setReportShowSummary] = useState(true);
  const [reportViewFormat, setReportViewFormat] = useState("table");
  const [reportAiSummary, setReportAiSummary] = useState<string | null>(null);
  const [hasSpokenSummary, setHasSpokenSummary] = useState(false);

  // Effect to speak AI summary when it becomes available in print layout
  useEffect(() => {
    if (isPrinting && reportAiSummary && !hasSpokenSummary) {
      const speech = new SpeechSynthesisUtterance(reportAiSummary);
      speech.lang = language === 'en' ? 'en-US' : 'ne-NP';
      speech.rate = 1.0;
      speech.pitch = 1.0;
      window.speechSynthesis.speak(speech);
      setHasSpokenSummary(true);
    }
    if (!isPrinting) {
      setHasSpokenSummary(false);
      window.speechSynthesis.cancel();
    }
  }, [isPrinting, reportAiSummary, hasSpokenSummary, language]);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<
    "tour" | "logic" | "offices" | "indicators" | "status" | "sync" | "settings"
  >("logic");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [pendingSharedReport, setPendingSharedReport] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("report") === "true") {
      setPendingSharedReport(true);
    }
  }, []);

  const handleSelectIndicatorFromBreakdown = (ind: Indicator) => {
    setSelectedIndicatorId(ind.id);
    setAboutModalTab('indicators');
    setIsAboutModalOpen(true);
  };

  const handleGenerateReport = (
    selectedIndicators: Indicator[],
    options: { customTitle: string; showSummary: boolean; viewFormat: string },
  ) => {
    setPrintIndicators(selectedIndicators);
    setReportTitle(options.customTitle);
    setReportShowSummary(options.showSummary);
    setReportViewFormat(options.viewFormat);
    setReportAiSummary(null);
    setIsReportBuilderOpen(false);
    setIsPrintConfirmOpen(true);
  };

  const generateAIReport = (customIndicators?: Indicator[]) => {
    const isEn = language === "en";
    const targetIndicators = customIndicators || filteredIndicators;
    
    setIsGeneratingAiSummary(true);
    addToast(
      isEn ? "Generating AI summary report..." : "एआई सारांश प्रतिवेदन तयार गर्दै...",
      undefined,
      "info"
    );

    fetch(`${API_BASE}/api/ai/report-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indicators: targetIndicators,
        language: language
      })
    })
    .then(async res => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Server error");
      }
      return res.json();
    })
    .then(data => {
      setReportAiSummary(data.summary || null);
      setPrintIndicators(targetIndicators);
      setReportTitle(isEn ? "AI Executive Summary Report" : "एआई कार्यकारी सारांश प्रतिवेदन");
      setReportShowSummary(true);
      setReportViewFormat("table");
      setIsPrinting(true);
      
      if (data.summary) {
        addToast(
          isEn ? "AI Report ready." : "एआई प्रतिवेदन तयार भयो।",
          undefined,
          "success"
        );
      }
    })
    .catch(err => {
      console.error("AI Report generation failed:", err);
      setReportAiSummary(null);
      setPrintIndicators(targetIndicators);
      setReportTitle(isEn ? "Consolidated Status Report" : "एकीकृत प्रगति प्रतिवेदन");
      setReportShowSummary(true);
      setReportViewFormat("table");
      setIsPrinting(true);
      
      const errMsg = err.message && err.message.includes("API key") 
        ? err.message 
        : (isEn ? "Failed to generate AI summary. Showing default report." : "एआई सारांश तयार गर्न असफल भयो।");
        
      addToast(
        errMsg,
        undefined,
        "warning"
      );
    })
    .finally(() => {
      setIsGeneratingAiSummary(false);
    });
  };

  const handleConfirmPrint = () => {
    setIsPrintConfirmOpen(false);
    setIsPrinting(true);
  };

  useEffect(() => {
    if (pendingSharedReport && indicators.length > 0 && !loading) {
      const params = new URLSearchParams(window.location.search);
      const ids = params.get("ids");
      const format = params.get("format") || "table";

      if (ids) {
        const idList = ids.split(",");
        const selectedIndicators = indicators.filter((ind) =>
          idList.includes(ind.id),
        );
        if (selectedIndicators.length > 0) {
          handleGenerateReport(selectedIndicators, {
            customTitle: "",
            showSummary: true,
            viewFormat: format,
          });
        }
      }
      setPendingSharedReport(false);
      // Clean up URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [pendingSharedReport, indicators, loading]);

  useEffect(() => {
    // Listen for system metadata updates
    const unsubMetadata = onSnapshot(
      doc(db, "metadata", "current"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SystemMetadata;
          setMetadata(data);
          try {
            localStorage.setItem("dor_metadata_cache", JSON.stringify(data));
            localStorage.setItem(
              "dor_last_sync_timestamp",
              new Date().toISOString(),
            );
          } catch (_) {
            // Suppress redundant log
          }
          setPulseKey((prev) => prev + 1);
        }
      },
      (err) => {
        // Suppress redundant log
      },
    );

    // Listen for indicators
    const q = query(collection(db, "indicators"), orderBy("id"));
    const unsubIndicators = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.empty) {
          const list: Indicator[] = [];
          const pending: Indicator[] = [];
          snap.forEach((d) => {
            const data = d.data() as Indicator;
            list.push(data);
            if (d.metadata.hasPendingWrites) {
              pending.push(data);
            }
          });
          setIndicators(list);
          setPendingWrites(pending);
          try {
            localStorage.setItem("dor_indicators_cache", JSON.stringify(list));
            localStorage.setItem(
              "dor_last_sync_timestamp",
              new Date().toISOString(),
            );
          } catch (_) {
            // Suppress redundant log
          }
          setPulseKey((prev) => prev + 1);
        } else {
          // Fallback to defaults if Firestore is empty
          setIndicators(DEFAULT_INDICATORS);
        }
        setLoading(false);
      },
      (err) => {
        // Suppress redundant log
        setIndicators(DEFAULT_INDICATORS);
        setLoading(false);
      },
    );

    const qHistory = query(
      collection(db, "updates_history"),
      orderBy("id", "desc"),
    );
    const unsubHistory = onSnapshot(
      qHistory,
      (snap) => {
        const history: any[] = [];
        snap.forEach((d) => history.push(d.data()));
        setUpdatesHistory(history);
      },
      (err) => {
        // Suppress redundant log
      },
    );

    // Populate historical data if not present - ONLY if admin or if it's the first time
    const populateHistoryOnce = async () => {
      if (
        typeof window === "undefined" ||
        !navigator.onLine ||
        indicators.length === 0
      )
        return;
      for (const hist of HISTORICAL_DATA) {
        const path = `updates_history/${hist.id}`;
        try {
          const historyRef = doc(db, "updates_history", hist.id);
          const snap = await getDoc(historyRef);
          if (!snap.exists()) {
            await setDoc(historyRef, hist);
          }
        } catch (e: any) {
          if (e?.code === "permission-denied") {
            console.warn(
              `Permission denied for populating history at ${path}. This is expected for non-admin users if data already exists.`,
            );
          } else if (
            e?.code !== "unavailable" &&
            !e?.message?.includes("offline")
          ) {
            console.error("Error populating historical data:", e);
          }
        }
      }
    };
    populateHistoryOnce();

    return () => {
      unsubMetadata();
      unsubIndicators();
      unsubHistory();
    };
  }, []);

  // Automatically create a historical snapshot in updates_history collection when metadata.lastUpdateDate changes
  useEffect(() => {
    if (
      !metadata ||
      !metadata.lastUpdateDate ||
      indicators.length === 0 ||
      !isOnline
    )
      return;

    const createHistoricalSnapshot = async () => {
      try {
        const docId = metadata.lastUpdateDate.replace(/\//g, "-");
        const historyRef = doc(db, "updates_history", docId);

        const snap = await getDoc(historyRef);
        if (!snap.exists()) {
          await setDoc(historyRef, {
            id: docId,
            lastUpdateDate: metadata.lastUpdateDate,
            createdAt: new Date().toISOString(),
            indicators: indicators.filter(Boolean).map((ind) => ({
              id: ind.id,
              name: ind.name,
              nameEn: ind.nameEn,
              sdg: ind.sdg,
              period: ind.period,
              weight: ind.weight,
              unit: ind.unit,
              baseline: ind.baseline,
              totalTarget: ind.totalTarget,
              totalProgress: ind.totalProgress,
              annualTarget: ind.annualTarget,
              annualProgress: ind.annualProgress,
              category: ind.category,
              updatedAt: ind.updatedAt || "",
              updatedBy: ind.updatedBy || "",
            })),
            metadata: {
              lastUpdateDate: metadata.lastUpdateDate,
              nextUpdateDate: metadata.nextUpdateDate || "",
              totalWeight: metadata.totalWeight || 0,
              totalWeightProgress: metadata.totalWeightProgress || 0,
            },
          });
        }
      } catch (_) {
        // Suppress redundant log
      }
    };

    createHistoricalSnapshot();
  }, [metadata?.lastUpdateDate, indicators, isOnline]);

  const groupedIndicators = useMemo(() => {
    return indicators.reduce(
      (acc, ind) => {
        if (!ind) return acc;
        const cat = normalizeCategory(ind.category);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ind);
        return acc;
      },
      {} as Record<string, Indicator[]>,
    );
  }, [indicators]);

  const categoryOrder = STANDARD_CATEGORIES;

  const filteredGroupedEntries = useMemo(() => {
    const entries = (Object.entries(groupedIndicators) as [string, Indicator[]][]).map(([category, inds]) => {
      const filtered = (inds || []).filter((ind: Indicator) => {
        if (!ind) return false;
        const name = ind.name || "";
        const nameEn = ind.nameEn || "";
        const categoryEn = ind.category || "";
        const categoryLocalized = t(categoryEn);
        const matchesSearch =
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categoryLocalized.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          viewMode === "institutional" || categoryFilter === "All" || normalizeCategory(ind.category) === categoryFilter;
        const matchesMilestone = !showMilestonesOnly || !!ind.isMilestone;
        
        const matchesOffice =
          selectedOffice === "All" ||
          (ind.office && (
            ind.office.trim() === selectedOffice.trim() ||
            ind.office.includes(selectedOffice) ||
            selectedOffice.includes(ind.office) ||
            (language === "en" && (translateOffice(ind.office) || "").includes(selectedOffice)) ||
            (language === "ne" && (translateOffice(selectedOffice) || "").includes(ind.office))
          ));

        return matchesSearch && matchesCategory && matchesMilestone && matchesOffice;
      });
      return [category, filtered] as [string, Indicator[]];
    }).filter(([_, inds]) => inds.length > 0);

    return entries.sort((a, b) => {
      const indexA = (categoryOrder as readonly string[]).indexOf(a[0]);
      const indexB = (categoryOrder as readonly string[]).indexOf(b[0]);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedIndicators, searchQuery, categoryFilter, showMilestonesOnly, selectedOffice, viewMode, t]);

  const filteredIndicators = useMemo(() => {
    return filteredGroupedEntries.flatMap(([_, inds]) => inds);
  }, [filteredGroupedEntries]);

  const getProgressPercent = (ind: Indicator) => {
    if (!ind || ind.annualTarget <= 0) return 0;
    return (ind.annualProgress / ind.annualTarget) * 100;
  };

  if (sortType === "low") {
    filteredIndicators.sort(
      (a, b) => getProgressPercent(a) - getProgressPercent(b),
    );
  } else if (sortType === "high") {
    filteredIndicators.sort(
      (a, b) => getProgressPercent(b) - getProgressPercent(a),
    );
  } else if (sortType === "weight") {
    filteredIndicators.sort((a, b) => (b.weight || 0) - (a.weight || 0));
  } else if (sortType === "status") {
    // Critical first: Lower percentage items first, prioritizing higher weights if percentages are equal
    filteredIndicators.sort((a, b) => {
      const diff = getProgressPercent(a) - getProgressPercent(b);
      if (Math.abs(diff) < 0.01) {
        return (b.weight || 0) - (a.weight || 0);
      }
      return diff;
    });
  }

  const { totalWeightForAvg, weightedRateForAvg, averageValue } = useMemo(() => {
    const totalWeightForAvg =
      indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
    const weightedRateForAvg = indicators.reduce((acc, curr) => {
      if (!curr) return acc;
      const progress =
        curr.annualTarget > 0
          ? Math.min((curr.annualProgress / curr.annualTarget) * 100, 100)
          : 0;
      return acc + progress * ((curr.weight || 0) / totalWeightForAvg);
    }, 0);
    const averageValue = Math.round(weightedRateForAvg);
    return { totalWeightForAvg, weightedRateForAvg, averageValue };
  }, [indicators]);

  const dashboardCalculations = useMemo(() => {
    const totalWeight = filteredIndicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
    
    const achievedWeight = filteredIndicators.reduce((acc, curr) => {
      if (!curr) return acc;
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + (achievement * ((curr.weight || 0) / 100));
    }, 0);
    
    const weightedRate = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;

    const ranges = [
      { labelEn: 'Excellent (80-100%)', labelNp: 'उत्कृष्ट (८०-१००%)', min: 80, max: 101, color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20', fill: '#10b981' },
      { labelEn: 'On Track (60-80%)', labelNp: 'सञ्चालनमा (६०-८०%)', min: 60, max: 80, color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20', fill: '#3b82f6' },
      { labelEn: 'Progressing (40-60%)', labelNp: 'प्रगतिमा (४०-६०%)', min: 40, max: 60, color: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500/20', fill: '#6366f1' },
      { labelEn: 'At Risk (20-40%)', labelNp: 'जोखिममा (२०-४०%)', min: 20, max: 40, color: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/20', fill: '#f59e0b' },
      { labelEn: 'Critical (0-20%)', labelNp: 'गम्भीर (०-२०%)', min: 0, max: 20, color: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500/20', fill: '#ef4444' },
    ];

    const distribution = ranges.map(range => {
      const count = filteredIndicators.filter(ind => {
        if (!ind) return false;
        const target = ind.annualTarget || 0;
        const progress = ind.annualProgress || 0;
        const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return achievement >= range.min && achievement < range.max;
      }).length;
      return { ...range, count };
    });

    // KPI status counts using the official status mapper
    const stats = filteredIndicators.reduce((acc, ind) => {
      if (!ind) return acc;
      const percent = ind.annualTarget > 0 ? Math.min(100, Math.round((ind.annualProgress / ind.annualTarget) * 100)) : 0;
      const { status } = getStatusBadge(percent, t);
      acc[status] += 1;
      acc.totalProgress += ind.annualProgress;
      acc.totalTarget += ind.annualTarget;
      return acc;
    }, { excellent: 0, onTrack: 0, progressing: 0, atRisk: 0, delayed: 0, totalProgress: 0, totalTarget: 0 });

    const snap1 = HISTORICAL_DATA[0] || { indicators: [] };
    const snap2 = HISTORICAL_DATA[1] || { indicators: [] };

    const getStatsForSnapshot = (snapshotIndicators: any[]) => {
      return filteredIndicators.reduce((acc, ind) => {
        const histInd = snapshotIndicators.find(h => h.id === ind.id || h.name === ind.name || h.name === ind.nameEn);
        const progress = histInd ? histInd.annualProgress : 0;
        const target = histInd ? histInd.annualTarget : ind.annualTarget;
        const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
        
        const { status } = getStatusBadge(percent, t);
        acc[status] += 1;
        return acc;
      }, { excellent: 0, onTrack: 0, progressing: 0, atRisk: 0, delayed: 0 });
    };

    const stats1 = getStatsForSnapshot(snap1.indicators);
    const stats2 = getStatsForSnapshot(snap2.indicators);

    const sparklineData = {
      excellent: [
        { value: stats1.excellent },
        { value: stats2.excellent },
        { value: stats.excellent }
      ],
      onTrack: [
        { value: stats1.onTrack },
        { value: stats2.onTrack },
        { value: stats.onTrack }
      ],
      progressing: [
        { value: stats1.progressing },
        { value: stats2.progressing },
        { value: stats.progressing }
      ],
      atRisk: [
        { value: stats1.atRisk },
        { value: stats2.atRisk },
        { value: stats.atRisk }
      ],
      delayed: [
        { value: stats1.delayed },
        { value: stats2.delayed },
        { value: stats.delayed }
      ]
    };

    const majorIndicators = [...filteredIndicators]
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 4);

    return {
      totalWeight,
      weightedRate,
      distribution,
      stats,
      sparklineData,
      majorIndicators
    };
  }, [filteredIndicators, t]);

  const translateCategory = useCallback((cat: string) => {
    const norm = normalizeCategory(cat);
    if (language === 'en') {
      return norm;
    }
    const map: Record<string, string> = {
      'Infrastructure Creation': 'पूर्वाधार निर्माण',
      'Maintenance': 'मर्मत सम्भार',
      'Budget Utilization': 'बजेट परिचालन',
      'Employment Creation': 'रोजगारी सिर्जना',
      'Governance': 'सुशासन'
    };
    return map[norm] || norm;
  }, [language]);

  const sectorsData = useMemo(() => {
    return STANDARD_CATEGORIES.map(categoryName => {
      const categoryIndicators = indicators.filter(ind => normalizeCategory(ind.category) === categoryName);
      if (categoryIndicators.length === 0) return { name: categoryName, value: 0 };
      
      const totalWeight = categoryIndicators.reduce((acc, curr) => acc + (curr.weight || 0), 0) || 100;
      const achievedWeight = categoryIndicators.reduce((acc, curr) => {
        const target = curr.annualTarget || 0;
        const progress = curr.annualProgress || 0;
        const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return acc + (achievement * ((curr.weight || 0) / 100));
      }, 0);
      const value = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
      return { name: categoryName, value };
    });
  }, [indicators]);

  const trendLineData = useMemo(() => {
    const today = new Date();
    const formattedEnToday = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedNeToday = "असार २३, २०८३";

    return [
      { 
        name: language === "en" ? 'Commencement' : 'प्रारम्भ', 
        score: 0,
        date: language === "en" ? 'Jul 16, 2025' : 'श्रावण १, २०८२'
      },
      { 
        name: language === "en" ? 'Q1 Milestone' : 'पहिलो त्रैमासिक', 
        score: 15,
        date: language === "en" ? 'Nov 16, 2025' : 'कार्तिक ३०, २०८२'
      },
      { 
        name: language === "en" ? 'Mid-Term' : 'मध्यावधि', 
        score: 51,
        date: language === "en" ? 'Feb 12, 2026' : 'फागुन १, २०८२'
      },
      { 
        name: language === "en" ? 'Current Hub' : 'हालको स्थिति', 
        score: dashboardCalculations.weightedRate,
        date: language === "en" ? formattedEnToday : formattedNeToday
      },
    ];
  }, [language, dashboardCalculations.weightedRate]);

  const lowestPerformingIndicators = useMemo(() => {
    return [...indicators]
      .filter(ind => (ind.annualTarget || 0) > 0)
      .map(ind => {
        const achievement = Math.round((ind.annualProgress / ind.annualTarget) * 100);
        return { ...ind, achievement };
      })
      .sort((a, b) => a.achievement - b.achievement)
      .slice(0, 5);
  }, [indicators]);

  const sortedAndCodedIndicators = useMemo(() => {
    const order = [
      'Infrastructure Creation',
      'Maintenance',
      'Budget Utilization',
      'Employment Creation',
      'Governance'
    ];
    const list = [...indicators].sort((a, b) => {
      const aSector = normalizeCategory(a.category);
      const bSector = normalizeCategory(b.category);
      return order.indexOf(aSector) - order.indexOf(bSector);
    });
    return list.map((ind, idx) => ({
      ...ind,
      serialCode: `PI-${(idx + 1).toString().padStart(2, '0')}`
    }));
  }, [indicators]);

  useEffect(() => {
    const handleAIOpenPage = (e: any) => {
      const page = e.detail?.page?.toLowerCase();
      setIsAIAssistantOpen(false);
      setTimeout(() => {
        if (["dashboard", "card", "chart", "table", "trend"].includes(page)) {
          handleViewChange(page as any);
        }
      }, 50);
    };

    const handleAIMakeReport = (e: any) => {
      const type = e.detail?.type || "comprehensive";
      setIsAIAssistantOpen(false);
      setTimeout(() => {
        handleGenerateReport(filteredIndicators, {
          customTitle: `AI ${type} Report`,
          showSummary: type === "comprehensive",
          viewFormat: "table",
        });
      }, 50);
    };

    const handleAIPrintScreen = () => {
      setIsAIAssistantOpen(false);
      setTimeout(() => {
        window.print();
      }, 80);
    };

    const handleAIShowMenu = () => {
      // Reserved for future use
    };

    const handleAISetVolume = (e: any) => {
      // Just a stub for audio/volume features
      addToast(
        `Volume ${e.detail?.enabled ? "enabled" : "disabled"}`,
        undefined,
        "info",
        3000,
      );
    };

    const handleAIMakeAudioReport = () => {
      generateAIReport();
    };

    window.addEventListener("ai:open_page", handleAIOpenPage);
    window.addEventListener("ai:make_report", handleAIMakeReport);
    window.addEventListener("ai:make_audio_report", handleAIMakeAudioReport);
    window.addEventListener("ai:print_screen", handleAIPrintScreen);
    window.addEventListener("ai:show_menu", handleAIShowMenu);
    window.addEventListener("ai:set_volume", handleAISetVolume);

    return () => {
      window.removeEventListener("ai:open_page", handleAIOpenPage);
      window.removeEventListener("ai:make_report", handleAIMakeReport);
      window.removeEventListener("ai:make_audio_report", handleAIMakeAudioReport);
      window.removeEventListener("ai:print_screen", handleAIPrintScreen);
      window.removeEventListener("ai:show_menu", handleAIShowMenu);
      window.removeEventListener("ai:set_volume", handleAISetVolume);
    };
  }, [filteredIndicators]);

  React.useEffect(() => {
    if (isFooterExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFooterExpanded]);

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChartFocusMode, setIsChartFocusMode] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const [fabRevealed, setFabRevealed] = useState(false);
  const fabHoverTimer = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewMode]);

  useEffect(() => {
    if (mainView !== 'dashboard') {
      setFabRevealed(false);
    }
  }, [mainView]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const currentY = window.scrollY || document.documentElement.scrollTop;

      const isBottom = currentY + windowHeight >= documentHeight - 120;
      setIsAtBottom(isBottom);
      setIsScrolled(currentY > 100 || isBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (_) {
      window.scrollTo(0, 0);
    }
    // Safeguard for nested scrolling containers and iframe constraints
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (_) {}
  };

  const scrollToBottom = () => {
    const targetY =
      document.documentElement.scrollHeight || document.body.scrollHeight;
    try {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    } catch (_) {
      window.scrollTo(0, targetY);
    }
    // Safeguard for nested scrolling containers and iframe constraints
    try {
      document.documentElement.scrollTop = targetY;
      document.body.scrollTop = targetY;
    } catch (_) {}
  };

  return (
    <>
      <DataHealthModal
        isOpen={isDataHealthModalOpen}
        onClose={() => setIsDataHealthModalOpen(false)}
        indicators={indicators}
        metadata={metadata}
        retryKey={healthRetryKey}
      />
      <IndicatorCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        indicator={selectedCommentsIndicator}
        addToast={addToast}
      />
      <ReportBuilderModal
        isOpen={isReportBuilderOpen}
        onClose={() => setIsReportBuilderOpen(false)}
        indicators={indicators}
        filteredIndicators={filteredIndicators}
        onGenerate={handleGenerateReport}
      />
      <PrintConfirmDialog
        isOpen={isPrintConfirmOpen}
        onClose={() => setIsPrintConfirmOpen(false)}
        onConfirm={handleConfirmPrint}
        indicators={
          printIndicators.length > 0 ? printIndicators : filteredIndicators
        }
        options={{
          customTitle: reportTitle,
          showSummary: reportShowSummary,
          viewFormat: reportViewFormat,
        }}
      />
      <MapViewModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        indicators={indicators}
      />
      <SystemHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        indicators={indicators}
        offices={offices}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        defaultTab="tour"
        isAdmin={isAdmin}
        lastUpdateDate={metadata?.lastUpdateDate}
        pendingWritesCount={pendingWrites.length}
        isOnline={isOnline}
        fiscalYear={selectedFiscalYear}
        onStartVoice={toggleGlobalVoiceListening}
      />
      <SystemHelpModal
        isOpen={isAboutModalOpen}
        onClose={() => {
          setIsAboutModalOpen(false);
          setSelectedIndicatorId(null);
        }}
        indicators={indicators}
        offices={offices}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        defaultTab={aboutModalTab}
        isAdmin={isAdmin}
        lastUpdateDate={metadata?.lastUpdateDate}
        pendingWritesCount={pendingWrites.length}
        isOnline={isOnline}
        fiscalYear={selectedFiscalYear}
        selectedIndicatorId={selectedIndicatorId}
        onStartVoice={toggleGlobalVoiceListening}
        addToast={addToast}
      />
      <LeftDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        language={language}
        activeView={mainView}
        onNavigate={handleMainViewChange}
        onOpenVisualInsights={goToVisualInsights}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenLogin={() => setShowLogin(true)}
      />
      <BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        language={language}
      />
      <IndicatorHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        indicator={selectedHistoryIndicator}
        updatesHistory={visibleHistory}
        fiscalYear={selectedFiscalYear}
      />
      <ActivityDetailDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        entry={selectedActivityEntry}
        updatesHistory={visibleHistory}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Offline Sync Queue Toast/Notification */}
      <AnimatePresence>
        {!isOnline && pendingWrites.length > 0 && !isOfflineQueueDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={
              isShaking
                ? {
                    x: [0, -8, 8, -8, 8, -4, 4, -2, 2, 0],
                    transition: { duration: 0.4, ease: "easeInOut" },
                  }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 md:right-8 z-[150] w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e1b4b] text-white rounded-3xl p-5 border border-slate-700 shadow-2xl shadow-indigo-950/40 overflow-hidden pointer-events-auto"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Database size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase">
                    {language === "en"
                      ? "Offline Sync Queue"
                      : "अफलाइन सिङ्क कतार"}
                  </h3>
                  <p className="text-[0.625rem] text-slate-450">
                    {language === "en"
                      ? "Pending items in local buffer"
                      : "स्थानीय बफरमा बाँकी वस्तुहरू"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOfflineQueueDismissed(true)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={language === "en" ? "Dismiss" : "हटाउनुहोस्"}
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 relative z-10">
              <p className="text-[0.6875rem] text-slate-300 leading-relaxed">
                {language === "en"
                  ? "You are offline. The following updates are securely buffered locally and will sync once connection is restored:"
                  : "तपाईं अफलाइन हुनुहुन्छ। निम्नलिखित परिवर्तनहरू स्थानीय बफरमा सुरक्षित छन् र जडान पुनर्स्थापित भएपछि सिङ्क हुनेछन्:"}
              </p>

              {/* List of pending items */}
              <div className="max-h-28 overflow-y-auto mt-2.5 space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {pendingWrites.map((item, index) => (
                  <motion.div
                    key={item.id + "-" + index}
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    onDragEnd={(event, info) => {
                      if (info.offset.x < -100) {
                        setPendingWrites(prev => prev.filter(p => p.id !== item.id));
                      }
                    }}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className="text-[0.625rem] bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between gap-2 text-slate-200 transition-colors hover:bg-white/10 hover:border-indigo-500/30 cursor-help"
                  >
                    <span className="truncate font-semibold flex-1 text-left">
                      {index + 1}. {language === "en" ? item.nameEn : item.name}
                    </span>
                    <span className="text-[0.5rem] bg-amber-500/20 text-amber-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                      {language === "en" ? "Queued" : "कतारमा"}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Detail Tooltip for hovered item */}
              <AnimatePresence>
                {hoveredItemId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-4 w-full bg-[#1e1b4b] border border-indigo-500/40 rounded-2xl p-4 shadow-2xl z-[160] overflow-hidden"
                  >
                    {/* Background patterns for tooltip */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                    {(() => {
                      const item = pendingWrites.find(
                        (p) => p.id === hoveredItemId,
                      );
                      if (!item) return null;
                      const priority =
                        item.weight >= 10
                          ? "Critical"
                          : item.weight >= 5
                            ? "High"
                            : "Normal";
                      const priorityNp =
                        item.weight >= 10
                          ? "अति महत्वपूर्ण"
                          : item.weight >= 5
                            ? "उच्च"
                            : "सामान्य";

                      return (
                        <>
                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                              {language === "en"
                                ? "Priority Field Sync"
                                : "प्राथमिकता क्षेत्र सिङ्क"}
                            </span>
                            <div
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                priority === "Critical"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : priority === "High"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-indigo-500/20 text-indigo-400"
                              }`}
                            >
                              {language === "en"
                                ? `${priority} Priority`
                                : `${priorityNp} प्राथमिकता`}
                            </div>
                          </div>

                          <div className="space-y-2 relative z-10">
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-400 uppercase">
                                  {language === "en"
                                    ? "Target Value"
                                    : "लक्ष्य मान"}
                                </span>
                                <span className="text-xs font-black text-white">
                                  {item.annualTarget}{" "}
                                   <span className="text-[9px] text-slate-500 font-normal">
                                     {translateUnit(item.unit)}
                                   </span>
                                </span>
                              </div>
                              <ArrowLeftRight
                                size={14}
                                className="text-slate-600"
                              />
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] font-bold text-indigo-400 uppercase">
                                  {language === "en"
                                    ? "Local Buffer"
                                    : "स्थानीय बफर"}
                                </span>
                                <span className="text-xs font-black text-indigo-400">
                                  {item.annualProgress}{" "}
                                  <span className="text-[9px] text-indigo-500/50 font-normal">
                                    {item.unit}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">
                                  {language === "en"
                                    ? "Impact Weight"
                                    : "प्रभाव भार"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Scale size={10} className="text-slate-400" />
                                  <span className="text-[10px] font-black text-slate-200">
                                    {item.weight}%
                                  </span>
                                </div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">
                                  {language === "en"
                                    ? "SDG Goal"
                                    : "SDG लक्ष्य"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Target
                                    size={10}
                                    className="text-amber-500"
                                  />
                                  <span className="text-[10px] font-black text-slate-200">
                                    {item.sdg || "9"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <RefreshCw
                                size={10}
                                className="text-indigo-500 animate-spin"
                              />
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                {language === "en"
                                  ? "Awaiting Handshake"
                                  : "जडानको प्रतीक्षामा"}
                              </span>
                            </div>
                            <span className="text-[8px] font-black text-indigo-400/70 italic uppercase">
                              TLS v1.3 Secure
                            </span>
                          </div>

                          {/* Arrow */}
                          <div className="absolute -bottom-1 left-8 w-2 h-2 bg-[#1e1b4b] rotate-45 border-r border-b border-indigo-500/40" />
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sync Progress Bar */}
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 relative z-10 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[0.5625rem] text-indigo-400 font-bold uppercase tracking-widest mb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                      {language === "en"
                        ? "Syncing with DoR server..."
                        : "सडक विभाग सर्भरसँग सिङ्क हुँदैछ..."}
                    </span>
                    <span>92%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{
                        width: ["0%", "15%", "45%", "75%", "92%"],
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeOut",
                        times: [0, 0.1, 0.35, 0.7, 1],
                      }}
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-pink-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sync trigger button */}
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <button
                disabled={isSyncing}
                onClick={async () => {
                  const currentOnline =
                    typeof window !== "undefined" ? navigator.onLine : false;
                  if (currentOnline) {
                    triggerHaptic("medium");
                    setIsOnline(true);
                    addToast(
                      "जडान पुनर्स्थापित भयो! सिङ्क्रोनाइजेसन सुरु गर्दै...",
                      "Connection restored! Starting manual synchronization...",
                      "info",
                      3000,
                    );
                    await handleManualSync();
                  } else {
                    triggerHaptic("warning");
                    setIsShaking(true);
                    setTimeout(() => setIsShaking(false), 500);
                    addToast(
                      "अझै अफलाइन हुनुहुन्छ। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।",
                      "Still offline. Please check your internet connection to retry sync.",
                      "warning",
                      4000,
                    );
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer ${isSyncing ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <RefreshCw
                  size={13}
                  className={isSyncing ? "animate-spin" : ""}
                />
                {isSyncing
                  ? language === "en"
                    ? "Syncing..."
                    : "सिङ्क हुँदैछ..."
                  : language === "en"
                    ? "Retry Sync Now"
                    : "अहिले पुन: सिङ्क प्रयास गर्नुहोस्"}
              </button>
            </div>

            {/* Small status line */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[0.5625rem] text-slate-500 font-bold uppercase tracking-widest border-t border-white/5 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>
                {language === "en"
                  ? "Connection Blocked"
                  : "इन्टरनेट अवरुद्ध छ"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPrinting && (
        <PrintLayout
          indicators={
            printIndicators.length > 0 ? printIndicators : filteredIndicators
          }
          metadata={metadata}
          updatesHistory={visibleHistory}
          customTitle={reportTitle}
          showSummary={reportShowSummary}
          viewFormat={reportViewFormat}
          onClose={() => setIsPrinting(false)}
          aiSummary={reportAiSummary}
        />
      )}

      <div
        className="relative min-h-[100dvh] bg-slate-50 dark:bg-[#0b1329] print:hidden"
        id="applet-frame"
      >

        <Header
          lastUpdateDate={metadata?.lastUpdateDate}
          pulseKey={pulseKey}
          onOpenMap={() => setIsMapModalOpen(true)}
           isOnline={isOnline}
           pendingWrites={pendingWrites}
           offices={offices}
           onOpenAbout={() => setIsAboutModalOpen(true)}
           onOpenDrawer={() => setIsDrawerOpen(true)}
           onMouseEnterAbout={() => setIsHoveringAbout(true)}
           onMouseLeaveAbout={() => setIsHoveringAbout(false)}
           mainView={mainView}
          onViewChange={handleMainViewChange}
          isAtBottom={isAtBottom}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          sortType={sortType}
          onSortChange={setSortType}
          selectedCategory={categoryFilter}
          onCategoryChange={(cat) => {
            setSearchQuery("");
            setCategoryFilter(cat);
          }}
          selectedOffice={selectedOffice}
          isOfficeLocked={!isSuperadmin && !!userAssignedOffice}
          onOfficeChange={(off) => {
            if (!isSuperadmin && userAssignedOffice && off !== userAssignedOffice) {
              return;
            }
            setSearchQuery("");
            setSelectedOffice(off);
          }}
          showMilestonesOnly={showMilestonesOnly}
          onToggleMilestonesOnly={() =>
            setShowMilestonesOnly(!showMilestonesOnly)
          }
           viewMode={viewMode}
           viewOptions={viewOptions as any}
           indicators={indicators}
           metadata={metadata}
           onMouseEnterFab={() => {
             if (mainView === 'dashboard') setFabRevealed(true);
           }}
           onMouseLeaveFab={() => {
             if (mainView === 'dashboard') setFabRevealed(false);
           }}
           trackedIds={trackedIds}
          onToggleTrack={toggleTrack}
          updatesHistory={visibleHistory}
          fiscalYear={selectedFiscalYear}
        />

        <div
          className={`flex flex-col min-h-[100dvh] transition-all duration-700 ease-in-out pt-2 sm:pt-4 pb-28 sm:pb-32 ${
            isFooterExpanded ? "opacity-0 pointer-events-none scale-[0.98]" : "opacity-100"
          }`}
        >
          <OfflineStatusBar />
           <main
             className="flex-1 container mx-auto px-4 md:pl-16 lg:pl-20 pb-8 max-w-7xl relative z-10 pt-[134px] sm:pt-[152px]"
             style={{ transition: "padding-top 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
             {/* Pull to Refresh Visual Indicator */}
            <AnimatePresence>
              {(isPulling || isSyncing) && (
                <motion.div
                  id="pull-to-refresh-indicator"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{
                    height: isSyncing
                      ? 56
                      : Math.max(48, Math.min(pullDistance, 56)),
                    opacity: isSyncing
                      ? 1
                      : Math.max(0.75, Math.min(pullDistance / 45, 1)),
                    marginBottom: isSyncing
                      ? 16
                      : Math.max(8, Math.min(pullDistance / 3, 16)),
                  }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-sm"
                >
                  <div className="flex items-center gap-2.5 py-2 px-4 select-none">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      {isSyncing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                          className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent"
                        />
                      ) : (
                        <motion.div
                          style={{
                            rotate: `${Math.min(pullDistance * 3.2, 180)}deg`,
                          }}
                          className="text-indigo-600 dark:text-indigo-400"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-[0.6875rem] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {isSyncing
                        ? language === "en"
                          ? "Synchronizing..."
                          : "सिंक्रोनाइज गर्दै..."
                        : pullDistance > 45
                          ? language === "en"
                            ? "Release to refresh"
                            : "छोड्नुहोस् रिफ्रेस गर्न"
                          : language === "en"
                            ? "Pull to refresh"
                            : "रिफ्रेस गर्न तान्नुहोस्"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoadingSkeleton />
                </motion.div>
              ) : !isOnline && !dismissedOfflineDashboard ? (
                <motion.div
                  key="offline-dashboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                >
                  <OfflineSummaryDashboard
                    indicators={indicators}
                    pendingWrites={pendingWrites}
                    onDismiss={() => setDismissedOfflineDashboard(true)}
                    onManualSync={handleManualSync}
                    isSyncing={isSyncing}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                 >
                   <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={mainView}
                      custom={direction}
                      variants={viewVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                        filter: { duration: 0.2 }
                      }}
                      className="w-full"
                    >
                      
                        {mainView === "dashboard" && (
                          <ErrorBoundary
                            fallback={
                              <div className="p-8 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Dashboard temporarily unavailable.
                                </p>
                              </div>
                            }
                          >
                             <DashboardSummaryView
                               indicators={indicators}
                               metadata={metadata}
                               offices={offices}
                               updatesHistory={visibleHistory}
                              onOpenAbout={(tab) => {
                                if (tab) setAboutModalTab(tab as any);
                                setIsAboutModalOpen(true);
                              }}
                              onOpenDataHealth={() => setIsDataHealthModalOpen(true)}
                              onIndicatorClick={handleIndicatorClick}
                              onOpenComments={handleOpenComments}
                              onViewHistory={(ind) => {
                                setSelectedHistoryIndicator(ind);
                                setIsHistoryDrawerOpen(true);
                              }}
                               onSelectIndicatorFromBreakdown={handleSelectIndicatorFromBreakdown}
                                highlightedCard={highlightedCard}
                                isFooterExpanded={isFooterExpanded}
                                isAtBottom={isAtBottom}
                             />
                           </ErrorBoundary>
                         )}
 
                          {mainView === "insights" && (
                            <ErrorBoundary
                              fallback={
                                <div className="p-8 text-center">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Visual Insights temporarily unavailable.
                                  </p>
                                </div>
                              }
                            >
                              <VisualInsightsView
                                indicators={indicators}
                                metadata={metadata}
                                updatesHistory={visibleHistory}
                                onOpenAbout={(tab) => {
                                  if (tab) setAboutModalTab(tab as any);
                                  setIsAboutModalOpen(true);
                                }}
                              />
                            </ErrorBoundary>
                          )}
 
                         {mainView === "trends" && (
                          <ErrorBoundary
                            fallback={
                              <div className="p-8 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Trends view temporarily unavailable.
                                </p>
                              </div>
                            }
                          >
                            <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
                               <TrendAnalysisView
                                 indicators={filteredIndicators}
                                 metadata={metadata}
                                 onOpenAbout={(tab) => {
                                   if (tab) setAboutModalTab(tab as any);
                                   setIsAboutModalOpen(true);
                                 }}
                               />
                            </div>
                          </ErrorBoundary>
                        )}

                        {mainView === "heatmap" && (
                          <ErrorBoundary
                            fallback={
                              <div className="p-8 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Heatmap temporarily unavailable.
                                </p>
                              </div>
                            }
                          >
                            <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
                              <IndicatorHeatmap
                                indicators={indicators}
                                updatesHistory={visibleHistory}
                              />
                            </div>
                          </ErrorBoundary>
                        )}

                         {mainView === "institutional" && (
                           <ErrorBoundary
                             fallback={
                               <div className="p-8 text-center">
                                 <p className="text-sm text-slate-500 dark:text-slate-400">
                                   Institutional view temporarily unavailable.
                                 </p>
                               </div>
                             }
                           >
                             <InstitutionalView
                               indicators={indicators}
                               metadata={metadata}
                               updatesHistory={visibleHistory}
                               sheetUpdates={sheetUpdates}
                               offices={offices}
                               onOpenAbout={(tab) => {
                                 if (tab) setAboutModalTab(tab as any);
                                 setIsAboutModalOpen(true);
                               }}
                               onViewActivityDetail={handleOpenLatestActivity}
                               onViewFullAuditTrail={handleOpenLatestActivity}
                               retryKey={healthRetryKey}
                              />
                            </ErrorBoundary>
                          )}

                          {mainView === "action-portal" && (
                            <ErrorBoundary
                              fallback={
                                <div className="p-8 text-center">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Action Portal temporarily unavailable.
                                  </p>
                                </div>
                              }
                            >
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-3xl mx-auto">
                                <ActionPortalView
                                  onOpenReportBuilder={() => setIsReportBuilderOpen(true)}
                                  onOpenHelp={() => setIsHelpOpen(true)}
                                  onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                                  onScrollTop={scrollToTop}
                                  onScrollBottom={scrollToBottom}
                                  onOpenAI={() => setIsAIAssistantOpen(true)}
                                  isScrolled={isScrolled}
                                  fiscalYear={selectedFiscalYear}
                                />
                              </div>
                            </ErrorBoundary>
                          )}
                     </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Footer */}
        <Footer
          onOpenReportBuilder={() => setIsReportBuilderOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
          onOpenAI={() => setIsAIAssistantOpen(true)}
          isScrolled={isScrolled}
          viewMode={viewMode}
          fiscalYear={selectedFiscalYear}
          isExpanded={isFooterExpanded}
          onExpandChange={setIsFooterExpanded}
          isAtBottom={isAtBottom}
        />

        {/* Dim Overlay - Outside scaled content */}
        <AnimatePresence>
          {isFooterExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFooterExpanded(false);
              }}
              className="fixed inset-0 bg-[#0b1329]/10 dark:bg-black/20 backdrop-blur-sm z-[80]"
            />
          )}
        </AnimatePresence>

        {/* Unified Floating Action Bar */}
        <div
          className="fixed bottom-4 right-4 md:bottom-6 md:right-8 mb-[env(safe-area-inset-bottom)] z-[1000] flex items-center transition-all duration-300 ease-out"
        >
          <div
            className={`flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl pl-2 pr-1 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-2xl transition-all duration-500 ease-out ${
              isReportBuilderOpen || !fabRevealed
                ? "opacity-0 scale-90 translate-x-2 pointer-events-none"
                : "opacity-100 scale-100 translate-x-0 pointer-events-auto"
            }`}
            style={{
              borderColor: mainView === 'dashboard' ? '#4f46e540' : mainView === 'trends' ? '#05966940' : mainView === 'heatmap' ? '#d9770640' : '#7c3aed40',
              boxShadow: `0 8px 32px ${mainView === 'dashboard' ? '#4f46e512' : mainView === 'trends' ? '#05966912' : mainView === 'heatmap' ? '#d9770612' : '#7c3aed12'}`
            }}
          >
              <div className="pr-2 mr-1 border-r border-slate-200 dark:border-slate-700 hidden sm:block">
                <span className="text-[0.5625rem] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                  {(() => {
                    if (mainView === 'insights') {
                      return language === 'en' ? 'Graph' : 'ग्राफ';
                    }
                    const item = NAV_ITEMS.find((i) => i.id === mainView);
                    return item
                      ? language === "en"
                        ? item.labelEn
                        : item.labelNp
                      : viewMode.replace("-", " ");
                  })()}
                </span>
              </div>

              {[
                { id: 'dashboard', labelEn: 'Home', labelNp: 'गृहपृष्ठ', icon: NAV_ITEMS[0].icon, onClick: () => handleMainViewChange('dashboard') },
                { id: 'chart', labelEn: 'Graph', labelNp: 'ग्राफ', icon: <BarChart3 size={16} />, onClick: () => handleMainViewChange('insights') },
                { id: 'trends', labelEn: 'Trends', labelNp: 'प्रवृत्ति', icon: NAV_ITEMS[1].icon, onClick: () => handleMainViewChange('trends') },
                { id: 'heatmap', labelEn: 'Heatmap', labelNp: 'हिटम्याप', icon: NAV_ITEMS[2].icon, onClick: () => handleMainViewChange('heatmap') },
                { id: 'institutional', labelEn: 'Institutional', labelNp: 'संस्थागत', icon: NAV_ITEMS[3].icon, onClick: () => handleMainViewChange('institutional') },
              ].map((item) => {
                const isActive = mainView === item.id || (item.id === 'chart' && mainView === 'insights');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      item.onClick();
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? item.id === 'chart'
                          ? 'text-violet-600 dark:text-violet-400 font-bold'
                          : mainView === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : mainView === 'trends' ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : mainView === 'heatmap' ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-violet-600 dark:text-violet-400 font-bold'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    title={language === 'en' ? item.labelEn : item.labelNp}
                  >
                    {React.cloneElement(item.icon, { size: 16, className: 'sm:w-[18px] sm:h-[18px]' })}
                  </button>
                );
              })}

              {/* Scroll Button (Up/Down) */}
              <motion.button
                onClick={() => {
                  triggerHaptic("light");
                  if (isScrolled) {
                    scrollToTop();
                  } else {
                    scrollToBottom();
                  }
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 cursor-pointer overflow-hidden font-bold"
                title={
                  isScrolled
                    ? language === "en"
                      ? "Scroll to top"
                      : "माथि जानुहोस्"
                    : language === "en"
                      ? "Scroll to bottom"
                      : "तल जानुहोस्"
                }
              >
                <motion.div
                  key={isScrolled ? "up" : "down"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  {isScrolled ? (
                    <ChevronUp size={16} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2.5} />
                  )}
                </motion.div>
              </motion.button>

              {pwaDismissed && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => {
                    triggerHaptic('light');
                    window.location.reload();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 cursor-pointer font-bold"
                  title={language === "en" ? "Check for updates" : "अपडेटहरू जाँच्नुहोस्"}
                >
                  <RefreshCw size={16} strokeWidth={2.5} />
                </motion.button>
              )}

              {/* AI Assistant FAB (Sparkles) */}
              <button
                onClick={() => {
                  triggerHaptic("success");
                  setIsAIAssistantOpen(true);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all active:scale-95 cursor-pointer relative font-bold"
                title={language === "en" ? "AI assistant" : "एआई सहायक"}
              >
                <Sparkles size={18} strokeWidth={2.5} />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </button>
            </div>

           {/* Always-visible small handle */}
           <motion.button
             onMouseEnter={() => {
               if (mainView !== 'dashboard') return;
               fabHoverTimer.current = window.setTimeout(() => setFabRevealed(true), 400);
             }}
             onMouseLeave={() => {
               if (fabHoverTimer.current) clearTimeout(fabHoverTimer.current);
               fabHoverTimer.current = null;
               setFabRevealed(false);
             }}
             onClick={() => setFabRevealed(p => !p)}
             onTouchStart={() => {
               if (mainView !== 'dashboard') return;
               setFabRevealed(true);
             }}
             onTouchEnd={() => setTimeout(() => setFabRevealed(false), 1200)}
             className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
             title={language === "en" ? "Actions" : "कार्यहरू"}
           >
             <Menu size={14} />
           </motion.button>
         </div>

         {/* Auth Toolbar */}
          <div
            className="fixed top-3 right-3 z-[900] flex items-center gap-1.5"
            onMouseEnter={() => {
              if (mainView === 'dashboard') setFabRevealed(true);
            }}
            onMouseLeave={() => {
              if (mainView === 'dashboard') setFabRevealed(false);
            }}
          >
          <select
            value={selectedFiscalYear}
            onChange={(e) => setSelectedFiscalYear(e.target.value)}
            className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            title={language === "en" ? "Select fiscal year" : "आर्थिक वर्ष चयन गर्नुहोस्"}
          >
            {[
              '2080/81', '2081/82', '2082/83', '2083/84', '2084/85', '2085/86',
              '2086/87', '2087/88', '2088/89', '2089/90'
            ].map(fy => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>

          {!user && !emailSession ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogin(true)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1.5"
              title={language === "en" ? "Sign in" : "साइन इन"}
            >
              <ShieldCheck size={13} />
              <span className="hidden sm:inline">{language === "en" ? "Sign In" : "साइन इन"}</span>
            </motion.button>
          ) : (
            <>
              {(isAdmin || isSuperadmin) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAdminPanel(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1.5"
                  title={language === "en" ? "User management" : "प्रयोगकर्ता व्यवस्थापन"}
                >
                  <Shield size={13} />
                  <span className="hidden sm:inline">{language === "en" ? "Users" : "प्रयोगकर्ता"}</span>
                </motion.button>
              )}
              {isSuperadmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsPanel(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all flex items-center gap-1.5"
                  title={language === "en" ? "System settings" : "प्रणाली सेटिङ"}
                >
                  <Settings size={13} />
                  <span className="hidden sm:inline">{language === "en" ? "Settings" : "सेटिङ"}</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  await logout();
                  setShowLogin(false);
                  setShowAdminPanel(false);
                  setShowSettingsPanel(false);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all flex items-center gap-1.5"
                title={language === "en" ? "Sign out" : "साइन आउट"}
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">{language === "en" ? "Logout" : "लगआउट"}</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Secure Bottom Control Dock & Scroll Indicator */}
        <div className="fixed bottom-0 left-0 w-full h-20 z-[900] pointer-events-none flex items-end justify-between px-6 pb-4">
        </div>

        {/* Dim Overlay - Outside scaled content */}
        <AnimatePresence>
          {isFooterExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFooterExpanded(false);
              }}
              className="fixed inset-0 bg-[#0b1329]/10 dark:bg-black/20 backdrop-blur-sm z-[80]"
            />
          )}
        </AnimatePresence>

        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />
        <VoiceUpdateModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onUpdate={(text) => {
            addToast(
              language === "en"
                ? `Update request: ${text}`
                : `अपडेट अनुरोध: ${text}`,
              language === "en"
                ? `Update request: ${text}`
                : `अपडेट अनुरोध: ${text}`,
              "info",
            );
            console.log("Update requested via voice:", text);
          }}
        />
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          language={language}
        />

        <AnimatePresence>
          {expandedHeatmapCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[45] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setExpandedHeatmapCategory(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const categories = [
                        { key: "Infrastructure Creation", labelEn: "Infrastructure", labelNp: "पूर्वाधार निर्माण", icon: Building2, colorClass: "text-emerald-500" },
                        { key: "Maintenance", labelEn: "Maintenance", labelNp: "मर्मतसम्भार", icon: Wrench, colorClass: "text-blue-500" },
                        { key: "Employment Creation", labelEn: "Employment", labelNp: "रोजगारी सिर्जना", icon: Users, colorClass: "text-indigo-500" },
                        { key: "Budget Utilization", labelEn: "Budget", labelNp: "बजेट उपयोग", icon: TrendingUp, colorClass: "text-amber-500" },
                        { key: "Governance", labelEn: "Governance", labelNp: "सुशासन", icon: Scale, colorClass: "text-purple-500" }
                      ];
                      const matched = categories.find(c => c.key === expandedHeatmapCategory);
                      if (!matched) return null;
                      const IconComp = matched.icon;
                      return (
                        <>
                          <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 ${matched.colorClass}`}>
                            <IconComp size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                              {language === "en" ? `${matched.labelEn} Sector` : `${matched.labelNp} क्षेत्र`}
                            </h3>
                            <p className="text-xs font-bold text-slate-400">
                              {language === "en" ? "Category Indicators Detail" : "क्षेत्रगत सूचकहरू विवरण"}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setExpandedHeatmapCategory(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Search / Filter Subbar */}
                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                  <div className="relative">
                    <input
                      type="text"
                      value={heatmapSearchQuery}
                      onChange={(e) => setHeatmapSearchQuery(e.target.value)}
                      placeholder={language === "en" ? "Search indicators by name or office..." : "नाम वा कार्यालय अनुसार सूचकहरू खोज्नुहोस्..."}
                      className="w-full px-4 py-2.5 pl-10 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Filter size={14} />
                    </span>
                    {heatmapSearchQuery && (
                      <button
                        onClick={() => setHeatmapSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {(() => {
                    const matchedIndicators = indicators.filter(ind => {
                      if (!ind) return false;
                      if (ind.category !== expandedHeatmapCategory) return false;
                      
                      const q = heatmapSearchQuery.trim().toLowerCase();
                      if (!q) return true;
                      
                      const name = (ind.name || "").toLowerCase();
                      const nameEn = (ind.nameEn || "").toLowerCase();
                       const office = (translateOffice(ind.office || "") || "").toLowerCase();
                      const code = (ind.code || "").toLowerCase();
                      
                      return name.includes(q) || nameEn.includes(q) || office.includes(q) || code.includes(q);
                    });

                    if (matchedIndicators.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          {language === "en" ? "No matching indicators found." : "कुनै मिल्दो सूचकहरू फेला परेनन्।"}
                        </div>
                      );
                    }

                    return matchedIndicators.map(ind => {
                      const progressPercent = ind.annualTarget > 0 ? Math.round((ind.annualProgress / ind.annualTarget) * 100) : 0;
                      
                      let badgeColorClass = "";
                      let dotColorClass = "";
                      let statusText = "";
                      let statusTextNp = "";

                      if (progressPercent >= 80) {
                        badgeColorClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20";
                        dotColorClass = "bg-emerald-500";
                        statusText = "Excellent";
                        statusTextNp = "उत्कृष्ट";
                      } else if (progressPercent >= 60) {
                        badgeColorClass = "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/20";
                        dotColorClass = "bg-blue-500";
                        statusText = "Good";
                        statusTextNp = "राम्रो";
                      } else if (progressPercent >= 40) {
                        badgeColorClass = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/20";
                        dotColorClass = "bg-indigo-500";
                        statusText = "Moderate";
                        statusTextNp = "मध्यम";
                      } else if (progressPercent >= 20) {
                        badgeColorClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/20";
                        dotColorClass = "bg-amber-500";
                        statusText = "Needs Attention";
                        statusTextNp = "ध्यान दिनुहोस्";
                      } else {
                        badgeColorClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20";
                        dotColorClass = "bg-rose-500";
                        statusText = "Critical";
                        statusTextNp = "नाजुक";
                      }

                      const indTitle = language === "en" ? ind.nameEn || ind.name : ind.name;

                      return (
                        <div
                          key={ind.id}
                          onClick={() => {
                            triggerHaptic("medium");
                            handleIndicatorClick(ind);
                          }}
                          className="group border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 hover:border-slate-200 dark:hover:border-slate-700/80 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              {/* Indicator Title */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-2 h-2 rounded-full ${dotColorClass} shrink-0`} />
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {indTitle}
                                </h4>
                              </div>
                              
                              {/* Meta Info (Office, Weight, Code) */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                                {ind.code && (
                                  <span className="font-mono bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5">
                                    {ind.code}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Building2 size={11} className="text-slate-300 dark:text-slate-500" />
                                  {translateOffice(ind.office) || (language === "en" ? "Central" : "केन्द्रीय")}
                                </span>
                                {ind.weight !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Target size={11} className="text-slate-300 dark:text-slate-500" />
                                    {language === "en" ? `Weight: ${ind.weight}` : `भार: ${ind.weight}`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${badgeColorClass}`}>
                              {language === "en" ? statusText : statusTextNp} ({progressPercent}%)
                            </span>
                          </div>

                          {/* Progress Metrics and Bar */}
                          <div className="mt-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="text-slate-400 font-medium">{language === "en" ? "Progress" : "प्रगति"}:</span>
                                <span className="text-slate-700 dark:text-slate-300">{ind.annualProgress} {translateUnit(ind.unit)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-slate-400 font-medium">{language === "en" ? "Target" : "लक्ष्य"}:</span>
                                <span className="text-slate-700 dark:text-slate-300">{ind.annualTarget} {translateUnit(ind.unit)}</span>
                              </span>
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                                transition={{ type: "spring", stiffness: 60, damping: 12 }}
                                className={`h-full ${dotColorClass} rounded-full`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                
                {/* Footer bar */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end">
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setExpandedHeatmapCategory(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer"
                  >
                    {language === "en" ? "Close" : "बन्द गर्नुहोस्"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Voice Navigation Assistant Status Card */}
        <AnimatePresence>
          {(isListeningVoice || voiceFeedback || voiceError) && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 right-6 md:right-8 z-[2000] w-full max-w-sm bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white rounded-3xl p-5 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 pointer-events-auto"
            >
              {/* Pulsing indicator background */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl flex items-center justify-center ${
                    voiceError
                      ? "bg-rose-500/20 text-rose-400"
                      : voiceSuccessTrigger
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-indigo-500/20 text-indigo-400 animate-pulse"
                  }`}>
                    {voiceError ? (
                      <MicOff size={20} strokeWidth={2} />
                    ) : (
                      <Mic size={20} strokeWidth={2} className={isListeningVoice ? "animate-bounce" : ""} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide">
                      {language === "en" ? "Voice Navigation" : "आवाज नेभिगेसन"}
                    </h3>
                    <p className="text-[0.625rem] text-slate-400">
                      {isListeningVoice 
                        ? (language === "en" ? "Listening to your command..." : "तपाईको निर्देशन सुन्दैछ...")
                        : voiceSuccessTrigger
                          ? (language === "en" ? "Command applied successfully!" : "निर्देशन सफलतापूर्वक लागू भयो!")
                          : (language === "en" ? "Voice response" : "आवाज प्रतिक्रिया")
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsListeningVoice(false);
                    setVoiceFeedback(null);
                    setVoiceError(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status messages / feedback text */}
              <div className="mt-4 relative z-10">
                {voiceError ? (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 leading-relaxed font-semibold">
                    {voiceError}
                  </p>
                ) : voiceFeedback ? (
                  <p className={`text-xs p-3 rounded-xl border leading-relaxed font-semibold ${
                    voiceSuccessTrigger 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  }`}>
                    {voiceFeedback}
                  </p>
                ) : (
                  <div className="bg-slate-800/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/30">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                      {language === "en" ? "Short commands:" : "छोटो आदेशहरू:"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['table', 'card', 'chart', 'trend', 'heatmap', 'dashboard', 'offices', 'report', 'all', 'infrastructure', 'maintenance', 'budget', 'governance'].map(cmd => (
                        <span key={cmd} className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                          "{cmd}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PWAInstallBanner />
        <PWAUpdatePrompt />

        {/* Login Overlay */}
        {showLogin && (
          <LoginScreen onClose={() => setShowLogin(false)} />
        )}

        {/* Admin Panel */}
        {showAdminPanel && (
          <AdminPanelModal
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            adminsList={adminsList}
            refreshAdmins={refreshAdmins}
            addToast={addToast}
            language={language}
          />
        )}

        {/* Superadmin Settings */}
        {showSettingsPanel && (
          <SettingsPanelModal
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            metadata={metadata}
            appSettings={appSettings}
            addToast={addToast}
            language={language}
            isSaving={isSavingSettings}
            setIsSaving={setIsSavingSettings}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  const [splashFiscalYear, setSplashFiscalYear] = useState('2082/83');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'system'));
        if (snap.exists() && !cancelled) {
          const fy = (snap.data() as { fiscalYear?: string }).fiscalYear;
          if (fy) setSplashFiscalYear(fy);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dor_') && key !== 'language') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <TextScaleProvider>
          <AuthProvider>
            {!isReady ? (
              <StartupScreen onComplete={() => setIsReady(true)} fiscalYear={splashFiscalYear} />
            ) : (
              <MainAppContent />
            )}
          </AuthProvider>
        </TextScaleProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
