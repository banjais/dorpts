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
import { IndicatorCommentsModal } from "./components/IndicatorCommentsModal";
import { IndicatorHistoryDrawer } from "./components/IndicatorHistoryDrawer";
import { ActivityDetailDrawer } from "./components/ActivityDetailDrawer";

import { TrendAnalysisView } from "./components/TrendAnalysisView";
import { VisualInsightsView } from "./components/VisualInsightsView";

import { InstitutionalView } from "./components/InstitutionalView";
import { AlertLogEntry } from "./components/AlertLog";
import { ViewMode, MainView, WidgetVisibility } from "./types";
import { NAV_ITEMS } from "./components/NavigationMenu";
import { LeftDrawerMenu } from "./components/LeftDrawerMenu";
import { BudgetModal } from "./components/BudgetModal";
import { PrintLayout } from "./components/PrintLayout";
import { ReportBuilderModal } from "./components/ReportBuilderModal";
import { PrintConfirmDialog } from "./components/PrintConfirmDialog";
import { MapViewModal } from "./components/MapViewModal";
import { DistanceCalculatorModal } from "./components/DistanceCalculatorModal";
import { HighwaysInfoView } from "./components/HighwaysInfoView";
import { SystemHelpModal } from "./components/SystemHelpModal";
import { IndicatorHeatmap } from "./components/IndicatorHeatmap";
import { OfflineSummaryDashboard } from "./components/OfflineSummaryDashboard";
import { Overview } from "./components/Overview";
import { AnnouncementBoard } from "./components/AnnouncementBoard";
import { useRegisterSW } from "virtual:pwa-register/react";
import { MessagingCenter } from "./components/MessagingCenter";
import { CalendarDeadlines } from "./components/CalendarDeadlines";
import { DetailedGalleryView } from "./components/DetailedGalleryView";
import { normalizeCategory, STANDARD_CATEGORIES, DEFAULT_CATEGORY_THEMES } from "./utils/category";
import { getFiscalYearForBsDateStr, toNepaliNumerals } from "./utils/bsDate";
import { API_BASE } from "./utils/apiBase";
import { fetchSheetData, fetchSpreadsheetMeta } from "./sheets";
import { syncPublishedSheets, buildCsvText } from "./utils/sheetSync";
import { useAuth } from "./context/AuthContext";
import { Indicator, SystemMetadata, Toast } from "./types";
import { APP_TITLES, APP_VERSION } from "./constants/appTitles";
import {
  parseGoogleSheetsCSV,
  DEFAULT_INDICATORS,
  setOfficesList,
} from "./data";
import { ToastContainer } from "./components/ToastContainer";
import { VoiceUpdateModal } from "./components/VoiceUpdateModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FeedbackModal } from "./components/FeedbackModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { OfflineStatusBar } from "./components/OfflineStatusBar";
import { LoginScreen } from "./components/LoginScreen";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ViewerDashboard } from "./components/ViewerDashboard";
import { SettingsPanelModal } from "./components/SettingsPanelModal";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardLayout } from "./hooks/useDashboardLayout";

import {
  Filter,
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
  Activity,
  Layers,
  ArrowLeftRight,
  Scale,
  Target,
  TrendingUp,
  MicOff,
  Database,
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
import { HISTORICAL_DATA } from "./historicalData";
import { triggerHaptic } from "./utils/haptic";
import { speak, speechPlayer, buildDashboardSummaryText, getMuted } from "./utils/speech";
import { getStatusBadge } from "./utils/status";

const viewOrder: Record<MainView, number> = {
  dashboard: 0,
  insights: 1,
  institutional: 2,
  trends: 3,
  heatmap: 4,
  superadmin: 5,
  admin: 6,
  viewer: 7,
  'detailed-gallery': 8,
  announcements: 9,
  messaging: 10,
  calendar: 11,
  feedbacks: 12,
  'highways-info': 13,
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
  const [needRefresh, setNeedRefresh] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const { updateServiceWorker } = useRegisterSW({
    intervalMS: 60 * 1000,
    onNeedRefresh: () => {
      setNeedRefresh(true);
      setTimeout(() => {
        updateServiceWorker(true);
      }, 2000);
    },
    onRegisteredSW: (_swUrl, registration) => {
      if (registration) {
        swRegistrationRef.current = registration;
        registration.update();
      }
    },
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('dor_redirecting') === '1') return;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && swRegistrationRef.current) {
        swRegistrationRef.current.update();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onFocus = () => {
      if (swRegistrationRef.current) {
        swRegistrationRef.current.update();
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const { language, t, translateOffice, translateUnit } = useLanguage();
  const { accessToken, user, loading: authLoading, isAdmin, isSuperadmin, logout, userAssignedOffice } = useAuth();

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [showLogin, setShowLogin] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState('analytics');
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
    dashboardTabId?: string;
    officesTabId?: string;
    copyrightEn?: string;
    copyrightNp?: string;
    officeBrandingEn?: string;
    officeBrandingNp?: string;
    sheet1PublishedUrl?: string;
    sheet2PublishedUrl?: string;
    sheet3PublishedUrl?: string;
    autoSyncEnabled?: boolean;
    syncInterval?: number;
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
    autoSyncEnabled: true,
    syncInterval: 5,
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
            copyrightEn: data.copyrightEn || prev.copyrightEn,
            copyrightNp: data.copyrightNp || prev.copyrightNp,
            officeBrandingEn: data.officeBrandingEn || prev.officeBrandingEn,
            officeBrandingNp: data.officeBrandingNp || prev.officeBrandingNp,
            sheet1PublishedUrl: data.sheet1PublishedUrl || prev.sheet1PublishedUrl,
            sheet2PublishedUrl: data.sheet2PublishedUrl || prev.sheet2PublishedUrl,
            sheet3PublishedUrl: data.sheet3PublishedUrl || prev.sheet3PublishedUrl,
            autoSyncEnabled: data.autoSyncEnabled !== undefined ? data.autoSyncEnabled : prev.autoSyncEnabled,
            syncInterval: data.syncInterval || prev.syncInterval,
          }));

          if (data.autoSyncEnabled !== undefined) {
            setAutoSyncEnabled(data.autoSyncEnabled);
            localStorage.setItem('autoSyncEnabled', data.autoSyncEnabled ? 'true' : 'false');
          }
          if (data.syncInterval) {
            setSyncInterval(data.syncInterval);
            localStorage.setItem('syncInterval', data.syncInterval.toString());
          }
        }
      } catch {
        // suppress
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const displayAppName = language === 'en' ? appSettings.appNameEn : appSettings.appNameNp;
    if (typeof document !== 'undefined') {
      document.title = displayAppName;
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', appSettings.themeColor);
    }
    APP_TITLES.appName.en = appSettings.appNameEn;
    APP_TITLES.appName.ne = appSettings.appNameNp;
    APP_TITLES.subHeader.en = appSettings.subHeaderEn;
    APP_TITLES.subHeader.ne = appSettings.subHeaderNp;
  }, [appSettings, language]);

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
        "सिङ्क्रोनाइजेसन सफल!",
        "Synchronized with DoR database!",
        "success",
        5000,
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissedOfflineDashboard(false);
      addToast(
        "अफलाइन मोड सक्रिय छ।",
        "Offline mode active.",
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

  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

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
        const annualTarget = isBlank(ind.annualTarget) ? 0 : ind.annualTarget;
        const annualProgress = isBlank(ind.annualProgress) ? 0 : ind.annualProgress;
        const totalTarget = isBlank(ind.totalTarget) ? 0 : ind.totalTarget;
        const totalProgress = isBlank(ind.totalProgress) ? 0 : ind.totalProgress;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<"default" | "low" | "high" | "weight" | "status">("default");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedOffice, setSelectedOffice] = useState<string>("All");
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [isDataHealthModalOpen, setIsDataHealthModalOpen] = useState(false);
  const [healthRetryKey, setHealthRetryKey] = useState(0);
  const [selectedCommentsIndicator, setSelectedCommentsIndicator] = useState<Indicator | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState<{ 
    name: string; 
    officeId: string; 
    shortName: string; 
    updated: string; 
    avgCompletion?: number; 
    total?: number; 
  }[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    triggerHaptic("medium");

    syncPublishedSheets({
      dashboard: appSettings.dashboardPublishedUrl,
      offices: appSettings.officesPublishedUrl,
    })
      .then((fallback) => {
        if (fallback.indicators && fallback.indicators.length > 0) {
          setIndicators(fallback.indicators);
          setMetadata(fallback.metadata);
        }
        if (fallback.offices && fallback.offices.length > 0) {
          setOffices(fallback.offices);
          setOfficesList(fallback.offices);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Data sync failed:", err);
        setLoading(false);
      });
  }, [appSettings, setIndicators]);

  useShakeToRefresh(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5);

  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [highlightedCard, setHighlightedCard] = useState<'insights' | null>(null);
  const [insightsDefaultTab, setInsightsDefaultTab] = useState<'health' | 'category' | 'indicators' | 'trends' | 'heatmap'>('health');

  const [direction, setDirection] = useState(0);

  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSuccessTrigger, setVoiceSuccessTrigger] = useState(false);

  const handleMainViewChange = useCallback((view: MainView, defaultTab?: string) => {
    if (view === mainView && !defaultTab) return;

    const newDirection = (viewOrder[view] || 0) - (viewOrder[mainView] || 0);
    setDirection(newDirection);
    setMainView(view);
    if (defaultTab) {
      setInsightsDefaultTab(defaultTab as any);
    }
    triggerHaptic('light');

    if (view === 'dashboard') {
      setViewMode('dashboard');
    } else if (view === 'insights') {
      setViewMode('dashboard');
    } else if (view === 'institutional') {
      setViewMode('institutional');
    } else if (view === 'trends') {
      setViewMode('chart');
    } else if (view === 'heatmap') {
      setViewMode('heatmap');
    }
  }, [mainView]);

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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDistanceCalcOpen, setIsDistanceCalcOpen] = useState(false);

  useEffect(() => {
    const handleOpenDistanceCalc = () => {
      setIsDistanceCalcOpen(true);
    };
    window.addEventListener('ai:open_distance_calc', handleOpenDistanceCalc);
    return () => {
      window.removeEventListener('ai:open_distance_calc', handleOpenDistanceCalc);
    };
  }, []);

  const goToVisualInsights = useCallback(() => {
    handleMainViewChange('insights');
    setIsDrawerOpen(false);
  }, [handleMainViewChange]);

  const handleViewChange = useCallback((view: ViewMode | "trend") => {
    setSearchQuery("");
    setCategoryFilter("All");
    setSelectedOffice("All");
    setSortType("default");
    setShowMilestonesOnly(false);

    if (view === "trend") {
      setMainView('trends');
      setViewMode("chart");
    } else {
      if (view === 'dashboard' || ['card', 'table', 'chart'].includes(view as string)) {
        setMainView('dashboard');
      } else if (view === 'heatmap') {
        setMainView('heatmap');
      } else if (['institutional', 'compare', 'unified'].includes(view as string)) {
        setMainView('institutional');
      }
      setViewMode(view as ViewMode);
    }
  }, []);

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
  const [selectedHistoryIndicator, setSelectedHistoryIndicator] = useState<Indicator | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedActivityEntry, setSelectedActivityEntry] = useState<any | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const toggleTrack = useCallback((id: string) => {
    setTrackedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  const speakDashboardSummary = useCallback(() => {
    if (typeof window !== 'undefined' && getMuted?.()) return;
    const total = indicators.length;
    const text = buildDashboardSummaryText(total, 75, [], language);
    speechPlayer.play(text, language);
  }, [indicators, language]);

  const handleIndicatorClick = (indicator: Indicator) => {
    setSearchQuery("");
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
    setTimeout(() => {
      setIsSyncing(false);
      addToast(
        language === "en" ? "Data synchronized" : "डेटा सिंक्रोनाइज गरियो",
        undefined,
        "success"
      );
    }, 1200);
  };

  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printIndicators, setPrintIndicators] = useState<Indicator[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportShowSummary, setReportShowSummary] = useState(true);
  const [reportViewFormat, setReportViewFormat] = useState("table");
  const [reportAiSummary, setReportAiSummary] = useState<string | null>(null);

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

  const handleConfirmPrint = () => {
    setIsPrintConfirmOpen(false);
    setIsPrinting(true);
  };

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

  const filteredGroupedEntries = useMemo(() => {
    return (Object.entries(groupedIndicators) as [string, Indicator[]][]).map(([category, inds]) => {
      const filtered = (inds || []).filter((ind: Indicator) => {
        if (!ind) return false;
        const name = ind.name || "";
        const nameEn = ind.nameEn || "";
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nameEn.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      return [category, filtered] as [string, Indicator[]];
    }).filter(([_, inds]) => inds.length > 0);
  }, [groupedIndicators, searchQuery]);

  const filteredIndicators = useMemo(() => {
    return filteredGroupedEntries.flatMap(([_, inds]) => inds);
  }, [filteredGroupedEntries]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [fabRevealed, setFabRevealed] = useState(false);

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
        indicators={printIndicators.length > 0 ? printIndicators : filteredIndicators}
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
        onStartVoiceSearch={() => setIsAIAssistantOpen(true)}
      />
      <DistanceCalculatorModal
        isOpen={isDistanceCalcOpen}
        onClose={() => setIsDistanceCalcOpen(false)}
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
        onOpenDistanceCalc={() => setIsDistanceCalcOpen(true)}
        onOpenMap={() => setIsMapModalOpen(true)}
        isSuperadmin={isSuperadmin}
      />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {isPrinting && (
        <PrintLayout
          indicators={printIndicators.length > 0 ? printIndicators : filteredIndicators}
          metadata={metadata}
          updatesHistory={visibleHistory}
          customTitle={reportTitle}
          showSummary={reportShowSummary}
          viewFormat={reportViewFormat}
          onClose={() => setIsPrinting(false)}
          aiSummary={reportAiSummary}
        />
      )}

      <div className="relative min-h-[100dvh] bg-slate-50 dark:bg-[#0b1329] print:hidden">
        {!showLogin && (
          <>
            <Header
              lastUpdateDate={metadata?.lastUpdateDate}
              pulseKey={pulseKey}
              onOpenMap={() => setIsMapModalOpen(true)}
              isOnline={isOnline}
              pendingWrites={pendingWrites}
              offices={offices}
              onOpenAbout={() => setIsAboutModalOpen(true)}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              mainView={mainView}
              onViewChange={handleMainViewChange}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              sortType={sortType}
              onSortChange={setSortType}
              selectedCategory={categoryFilter}
              onCategoryChange={setCategoryFilter}
              selectedOffice={selectedOffice}
              onOfficeChange={setSelectedOffice}
              showMilestonesOnly={showMilestonesOnly}
              onToggleMilestonesOnly={() => setShowMilestonesOnly(!showMilestonesOnly)}
              viewMode={viewMode}
              viewOptions={viewOptions as any}
              indicators={indicators}
              metadata={metadata}
              trackedIds={trackedIds}
              onToggleTrack={toggleTrack}
              updatesHistory={visibleHistory}
              fiscalYear={selectedFiscalYear}
            />

            <div className="flex flex-col min-h-[100dvh] pt-2 sm:pt-4 pb-28 sm:pb-32 bg-gradient-to-b from-slate-50/80 via-slate-50/60 to-slate-100/80 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80">
              <OfflineStatusBar />
              <main className="flex-1 container mx-auto px-4 md:pl-16 lg:pl-20 pb-8 max-w-7xl relative z-10 pt-[134px] sm:pt-[152px]">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center space-y-3">
                          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {language === 'en' ? 'Loading dashboard...' : 'ड्यासबोर्ड लोड हुँदै...'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AnimatePresence mode="wait" custom={direction}>
                          <motion.div
                            key={mainView}
                            custom={direction}
                            variants={viewVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="w-full"
                          >
                            {mainView === "dashboard" && (
                              <Overview
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
                                onNavigateToView={handleMainViewChange}
                                onSpeakDashboardSummary={speakDashboardSummary}
                                mainView={mainView}
                              />
                            )}

                            {mainView === "highways-info" && (
                              <ErrorBoundary
                                fallback={
                                  <div className="p-8 text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      Highways information temporarily unavailable.
                                    </p>
                                  </div>
                                }
                              >
                                <HighwaysInfoView />
                              </ErrorBoundary>
                            )}

                            {mainView === "insights" && (
                              <VisualInsightsView
                                indicators={indicators}
                                metadata={metadata}
                                updatesHistory={visibleHistory}
                                onOpenAbout={(tab) => {
                                  if (tab) setAboutModalTab(tab as any);
                                  setIsAboutModalOpen(true);
                                }}
                                defaultInsightTab={insightsDefaultTab}
                                onNavigateToView={handleMainViewChange}
                              />
                            )}

                            {mainView === "trends" && (
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
                            )}

                            {mainView === "heatmap" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
                                <IndicatorHeatmap
                                  indicators={indicators}
                                  updatesHistory={visibleHistory}
                                />
                              </div>
                            )}

                            {mainView === "institutional" && (
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
                                retryKey={healthRetryKey}
                              />
                            )}

                            {mainView === "superadmin" && (
                              <SuperAdminDashboard language={language} activeTab={superAdminActiveTab} onTabChange={setSuperAdminActiveTab} offices={offices} />
                            )}
                            {mainView === "admin" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
                                <AdminDashboard language={language} activeTab={superAdminActiveTab} onTabChange={setSuperAdminActiveTab} offices={offices} />
                              </div>
                            )}
                            {mainView === "viewer" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
                                <ViewerDashboard language={language} activeTab={superAdminActiveTab} onTabChange={setSuperAdminActiveTab} />
                              </div>
                            )}
                            {mainView === "announcements" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
                                <AnnouncementBoard />
                              </div>
                            )}
                            {mainView === "messaging" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto">
                                <MessagingCenter language={language} offices={offices} isAdmin={isAdmin} />
                              </div>
                            )}
                            {mainView === "calendar" && (
                              <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto">
                                <CalendarDeadlines language={language} offices={offices} />
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </>
        )}

        {!showLogin && (
          <Footer
            onOpenReportBuilder={() => setIsReportBuilderOpen(true)}
            onOpenAI={() => setIsAIAssistantOpen(true)}
            isScrolled={isScrolled}
            viewMode={viewMode}
            fiscalYear={selectedFiscalYear}
            isExpanded={isFooterExpanded}
            onExpandChange={setIsFooterExpanded}
            isSyncing={isSyncing}
            onManualSync={handleManualSync}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenMessaging={() => handleMainViewChange('messaging')}
            onGoHome={() => handleMainViewChange('dashboard')}
            pendingWrites={pendingWrites}
            hasPendingWrites={pendingWrites.length > 0}
            isAdmin={isAdmin}
            needRefresh={needRefresh}
            onUpdateClick={() => updateServiceWorker(true)}
          />
        )}

        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />

        <PWAInstallBanner />

        {showLogin && (
          <LoginScreen onClose={user ? () => setShowLogin(false) : undefined} />
        )}

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
