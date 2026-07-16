import React, { useRef } from "react";
import { Indicator } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { normalizeCategory, getCategoryColor } from "../utils/category";
import {
  Edit3,
  History,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Bell,
  Activity,
  Zap,
  Eye,
  MoveRight,
  Sliders,
  AlertTriangle,
  X,
  Layout,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence, useInView, useMotionValue, animate } from "motion/react";
import { getStatusBadge } from "../utils/status";
import { triggerHaptic } from "../utils/haptic";
import { highlightText } from "../utils/highlight";
import { useTextScale } from "../hooks/useTextScale";
import { formatDisplayDate } from "../utils/date";

interface HistoryItem {
  id: string;
  createdAt: string;
  indicators: Array<{
    id: string;
    annualProgress: number;
    updatedAt: string;
  }>;
}

interface CardProps {
  indicator: Indicator;
  onEdit: (indicator: Indicator) => void;
  onViewHistory?: (indicator: Indicator) => void;
  updatesHistory?: HistoryItem[];
  isTracked?: boolean;
  onToggleTrack?: () => void;
  onThresholdChange?: (indicatorId: string, threshold: number | null) => void;
  totalIndicatorWeight?: number;
  onClick?: (indicator: Indicator) => void;
  onOpenComments?: (indicator: Indicator) => void;
  categoryThemes?: Record<string, string>;
  searchQuery?: string;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px 0px" });

  React.useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" });
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};


export const IndicatorCard = React.memo<CardProps>(
  ({
    indicator,
    onEdit,
    onViewHistory,
    updatesHistory = [],
    isTracked = false,
    onToggleTrack,
    onThresholdChange,
    totalIndicatorWeight = 0,
    onClick,
    onOpenComments,
    categoryThemes,
    searchQuery = ""
  }) => {
    const { isAdmin } = useAuth();
    const { language, t, translateUnit, translatePeriod } = useLanguage();
    const { highContrast } = useTextScale();

    const cardRef = useRef<HTMLDivElement>(null);
    const [hoveredPointIdx, setHoveredPointIdx] = React.useState<number | null>(
      null,
    );
    const [showFastLook, setShowFastLook] = React.useState(false);
    const [showThresholdConfig, setShowThresholdConfig] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState(0);
    const [statusView, setStatusView] = React.useState<'annual' | 'total'>('annual');
    const [threshold, setThreshold] = React.useState<number | null>(() => {
      if (typeof window !== "undefined" && indicator) {
        const saved = localStorage.getItem(
          `indicator-threshold-${indicator.id}`,
        );
        return saved ? Number(saved) : null;
      }
      return null;
    });
    const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const thresholdCrossedRef = React.useRef<'none' | 'left' | 'right'>('none');

    const catColor = getCategoryColor(indicator.category, categoryThemes);

    const isHighImpact =
      totalIndicatorWeight > 0 &&
      indicator.weight / totalIndicatorWeight >= 0.1;

    const hasTotalTarget =
      indicator.totalTarget !== null && indicator.totalTarget !== undefined;
    const hasTotalProgress =
      indicator.totalProgress !== null && indicator.totalProgress !== undefined;

    const annualCompletionPercent =
      indicator.annualTarget > 0
        ? Math.round((indicator.annualProgress / indicator.annualTarget) * 100)
        : 0;

    const startPress = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const event = e as React.MouseEvent;
      if (event.button && event.button !== 0) return;

      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("input")
      ) {
        return;
      }

      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }

      pressTimerRef.current = setTimeout(() => {
        // Long-press peek (fast-look) only — normal click opens detail separately
        setShowFastLook(true);
        triggerHaptic('medium');
      }, 550);
    }, [indicator]);

    const handleCardClick = React.useCallback((e: React.MouseEvent) => {
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("input")
      ) {
        return;
      }
      // Open the extended detail page immediately on a normal click/tap
      if (onClick) {
        onClick(indicator);
      }
    }, [onClick, indicator]);

    const endPress = React.useCallback(() => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setShowFastLook(false);

      if (annualCompletionPercent >= 100) {
        triggerHaptic('success');
      } else if (annualCompletionPercent < 50) {
        triggerHaptic('warning');
      } else {
        triggerHaptic('light');
      }
    }, [annualCompletionPercent]);

    const touchStartCoords = React.useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      startPress(e);
      const touch = e.touches[0];
      touchStartCoords.current = { x: touch.clientX, y: touch.clientY };
    }, [startPress]);

    const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
      if (!touchStartCoords.current) return;
      const touch = e.touches[0];
      const diffX = touch.clientX - touchStartCoords.current.x;
      const diffY = touch.clientY - touchStartCoords.current.y;

      // Focus on horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Prevent vertical page scroll when intentionally swiping
        if (Math.abs(diffX) > 10) {
          endPress();
          try {
            if (e.cancelable) e.preventDefault();
          } catch {
            // Ignore preventDefault errors
          }
        }
        setDragOffset(diffX);

        const threshold = 80;
        if (diffX < -threshold) {
          if (thresholdCrossedRef.current !== 'left') {
            thresholdCrossedRef.current = 'left';
            triggerHaptic('heavy');
          }
        } else if (diffX > threshold) {
          if (thresholdCrossedRef.current !== 'right') {
            thresholdCrossedRef.current = 'right';
            triggerHaptic('heavy');
          }
        } else {
          if (thresholdCrossedRef.current !== 'none') {
            thresholdCrossedRef.current = 'none';
            triggerHaptic('light');
          }
        }
      }
    }, [endPress]);

    const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
      endPress();
      if (!touchStartCoords.current) {
        setDragOffset(0);
        thresholdCrossedRef.current = 'none';
        return;
      }
      const touch = e.changedTouches[0] || e.touches[0];
      const threshold = 80;
      
      let finalDiffX = dragOffset;
      let finalDiffY = 0;
      if (touch) {
        finalDiffX = touch.clientX - touchStartCoords.current.x;
        finalDiffY = touch.clientY - touchStartCoords.current.y;
      }

      if (Math.abs(finalDiffY) > Math.abs(finalDiffX) && Math.abs(finalDiffY) > 50) {
          setStatusView(prev => prev === 'annual' ? 'total' : 'annual');
          triggerHaptic('light');
      } else if (finalDiffX < -threshold) {
        if (onToggleTrack) {
          onToggleTrack();
          triggerHaptic('success');
        }
      } else if (finalDiffX > threshold) {
        if (onViewHistory) {
          onViewHistory(indicator);
          triggerHaptic('success');
        }
      }

      touchStartCoords.current = null;
      thresholdCrossedRef.current = 'none';
      setDragOffset(0);
    }, [endPress, dragOffset, onToggleTrack, onViewHistory, indicator, setStatusView]);

    const glowStyles = React.useMemo(() => {
      if (Math.abs(dragOffset) < 5) return {};
      const ratio = Math.min(1, Math.abs(dragOffset) / 100);
      const intensity = ratio * 0.55;
      const size = 12 + ratio * 24;
      
      if (dragOffset > 0) {
        // Amber Glow (right swipe -> history)
        return {
          boxShadow: `0 0 ${size}px rgba(245, 158, 11, ${intensity}), inset 0 0 10px rgba(245, 158, 11, ${ratio * 0.25})`,
          borderColor: `rgba(245, 158, 11, ${Math.min(0.9, ratio * 0.85)})`
        };
      } else {
        // Left swipe -> Track (Emerald or Rose if tracked)
        if (isTracked) {
          return {
            boxShadow: `0 0 ${size}px rgba(239, 68, 68, ${intensity}), inset 0 0 10px rgba(239, 68, 68, ${ratio * 0.25})`,
            borderColor: `rgba(239, 68, 68, ${Math.min(0.9, ratio * 0.85)})`
          };
        } else {
          return {
            boxShadow: `0 0 ${size}px rgba(16, 185, 129, ${intensity}), inset 0 0 10px rgba(16, 185, 129, ${ratio * 0.25})`,
            borderColor: `rgba(16, 185, 129, ${Math.min(0.9, ratio * 0.85)})`
          };
        }
      }
    }, [dragOffset, isTracked]);

    const [showHistoricalTrend, setShowHistoricalTrend] = React.useState(false);
    const [isCompact, setIsCompact] = React.useState(false);
    const [isSmallScreen, setIsSmallScreen] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => setIsSmallScreen(window.innerWidth < 480);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const actualIsCompact = isCompact || isSmallScreen;

    // Scroll animations for focus effect
    const { scrollYProgress } = useScroll({
      target: cardRef,
      offset: ["start end", "center center", "end start"],
    });

    // Scale: 0.9 (bottom/top) -> 1.05 (center) -> 0.9 (top/bottom)
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.9]);

    // Opacity: 0.3 (edge) -> 1 (center) -> 0.3 (edge)
    const opacity = useTransform(
      scrollYProgress,
      [0, 0.2, 0.5, 0.8, 1],
      [0, 0.4, 1, 0.4, 0],
    );

    // Y offset: Subtle floating effect as it enters/leaves
    const y = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -20]);

    // Calculations
    const isAlertActive =
      threshold !== null && annualCompletionPercent <= threshold;

    const status = getStatusBadge(annualCompletionPercent, t);

    const getConfidenceBadge = () => {
      if (!indicator.updatedAt) return null;
      const updateDate = new Date(indicator.updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - updateDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 7) {
        return {
          color:
            "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          label: language === "en" ? "<1w" : "<१ हप्ता",
        };
      } else if (diffDays <= 14) {
        return {
          color:
            "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          label: language === "en" ? "1-2w" : "१-२ हप्ता",
        };
      } else {
        return {
          color:
            "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          label: language === "en" ? ">2w" : ">२ हप्ता",
        };
      }
    };
    const confidenceBadge = getConfidenceBadge();

    const getSdgColor = (sdg: string) => {
      switch (sdg) {
        case "9":
          return "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border-sky-101/50 dark:border-sky-900/30";
        case "8":
          return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-101/50 dark:border-emerald-900/30";
        case "16":
          return "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-101/50 dark:border-violet-900/30";
        default:
          return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700";
      }
    };

    const getPeriodColor = (period: string) => {
      const isMonthly = period === "मासिक" || period === "Monthly";
      return isMonthly
        ? "bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-101/30 dark:border-indigo-900/30"
        : "bg-amber-50/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-101/30 dark:border-amber-900/30";
    };

    const primaryName =
      language === "en" ? indicator.nameEn || indicator.name : indicator.name;
    const secondaryName =
      language === "en" ? indicator.name : indicator.nameEn || indicator.name;

    // Extract and calculate sparkline points
    const sparklineData = React.useMemo(() => {
      if (!updatesHistory || !indicator) return [];

      const extracted = updatesHistory
        .map((historyItem) => {
          const indSnap = historyItem.indicators?.find(
            (i) => i.id === indicator.id,
          );
          if (!indSnap) return null;

          return {
            id: historyItem.id,
            annualProgress: indSnap.annualProgress || 0,
            updatedAt: indSnap.updatedAt || historyItem.createdAt || "",
          };
        })
        .filter((item): item is { id: string; annualProgress: number; updatedAt: string } => item !== null);

      const hasCurrentInHistory = extracted.some(
        (log) =>
          log.annualProgress === indicator.annualProgress &&
          new Date(log.updatedAt).toLocaleDateString() ===
            new Date(indicator.updatedAt || "").toLocaleDateString(),
      );

      if (!hasCurrentInHistory && indicator.updatedAt) {
        extracted.unshift({
          id: "current-live",
          annualProgress: indicator.annualProgress,
          updatedAt: indicator.updatedAt,
        });
      }

      // Sort chronologically (most recent first)
      const sorted = extracted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      // Take last 5 updates and reverse to get oldest-to-newest chronological order
      return sorted.slice(0, 5).reverse();
    }, [indicator, updatesHistory]);

    const displayPoints = React.useMemo(() => {
      const points = sparklineData.map((d) => d.annualProgress);
      return points.length === 1
        ? [
            typeof indicator.baseline === "number" ? indicator.baseline : 0,
            points[0],
          ]
        : points;
    }, [sparklineData, indicator.baseline]);

    // Calculate oldest and newest sparkline point values & their raw numerical delta
    const fastLookMetrics = React.useMemo(() => {
      if (sparklineData.length >= 2) {
        const oldest = sparklineData[0];
        const newest = sparklineData[sparklineData.length - 1];
        const oldestVal = oldest.annualProgress;
        const newestVal = newest.annualProgress;
        const delta = newestVal - oldestVal;

        const oldestDate = oldest.updatedAt ? formatDisplayDate(oldest.updatedAt, language) : "";
        const newestDate = newest.updatedAt ? formatDisplayDate(newest.updatedAt, language) : "";

        return {
          oldestVal,
          newestVal,
          delta,
          oldestLabel:
            oldestDate ||
            (language === "en" ? "Oldest Point" : "सबैभन्दा पुरानो बिन्दु"),
          newestLabel:
            newestDate ||
            (language === "en" ? "Latest Point" : "नवीनतम बिन्दु"),
          hasData: true,
        };
      } else if (sparklineData.length === 1) {
        const oldestVal =
          typeof indicator.baseline === "number" ? indicator.baseline : 0;
        const newest = sparklineData[0];
        const newestVal = newest.annualProgress;
        const delta = newestVal - oldestVal;

        const newestDate = newest.updatedAt ? formatDisplayDate(newest.updatedAt, language) : "";

        return {
          oldestVal,
          newestVal,
          delta,
          oldestLabel:
            language === "en" ? "Baseline" : "प्रारम्भिक मान (Baseline)",
          newestLabel:
            newestDate ||
            (language === "en" ? "Latest Point" : "नवीनतम बिन्दु"),
          hasData: true,
        };
      }
      return {
        oldestVal: 0,
        newestVal: 0,
        delta: 0,
        oldestLabel: "",
        newestLabel: "",
        hasData: false,
      };
    }, [sparklineData, indicator.baseline, language]);

    // Calculate Anomaly / Outlier indices in the historical progression
    const anomalyIndices = React.useMemo(() => {
      if (displayPoints.length < 3) return [];

      const n = displayPoints.length;
      const mean = displayPoints.reduce((sum, v) => sum + v, 0) / n;
      const variance =
        displayPoints.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const target = indicator.annualTarget || 100;

      return displayPoints
        .map((val, idx) => {
          // 1. Z-score anomaly detection (significant deviation from the series mean)
          if (stdDev > 0) {
            const zScore = Math.abs(val - mean) / stdDev;
            // In small sample sizes (3 to 5), a z-score above 1.35 is an extreme outlier
            if (zScore > 1.35) return true;
          }

          // 2. Local extrema anomaly detection (sharp spike or drop)
          if (idx > 0 && idx < n - 1) {
            const prev = displayPoints[idx - 1];
            const next = displayPoints[idx + 1];
            const diffPrev = val - prev;
            const diffNext = val - next;
            // Check if it is a spike or a dip
            const isSpikeOrDip = Math.sign(diffPrev) === Math.sign(diffNext);
            const hasHighAmplitude =
              Math.abs(diffPrev) > target * 0.25 &&
              Math.abs(diffNext) > target * 0.25;
            if (isSpikeOrDip && hasHighAmplitude) return true;
          }

          return false;
        })
        .map((isAnomaly, idx) => (isAnomaly ? idx : -1))
        .filter((idx) => idx !== -1);
    }, [displayPoints, indicator.annualTarget]);

    const minVal = Math.min(...displayPoints);
    const maxVal = Math.max(...displayPoints);
    const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const width = 120;
    const height = 30;
    const padding = 2;

    // Map each value to SVG coordinates
    const svgPoints = React.useMemo(() => {
      return displayPoints.map((val, idx) => {
        const x =
          padding +
          (idx / (displayPoints.length - 1 || 1)) * (width - 2 * padding);
        const y =
          padding + (1 - (val - minVal) / valRange) * (height - 2 * padding);
        return { x, y, val };
      });
    }, [displayPoints, minVal, valRange]);

    // Generate path strings
    const linePath = React.useMemo(() => {
      return svgPoints
        .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    }, [svgPoints]);

    const areaPath = React.useMemo(() => {
      return svgPoints.length > 0
        ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height} L ${svgPoints[0].x} ${height} Z`
        : "";
    }, [svgPoints, linePath]);

    const startVal = displayPoints[0] || 0;
    const endVal = displayPoints[displayPoints.length - 1] || 0;
    const isTrendUp = endVal > startVal;
    const isTrendDown = endVal < startVal;

    const changePercentage =
      startVal > 0
        ? Math.round(((endVal - startVal) / startVal) * 100)
        : endVal > 0
          ? 100
          : 0;

    const trendText = React.useMemo(() => {
      if (isTrendUp) {
        return language === "en"
          ? `+${changePercentage}% Accelerating`
          : `+${changePercentage}% तीव्र गति`;
      } else if (isTrendDown) {
        return language === "en"
          ? `${changePercentage}% Decelerating`
          : `${changePercentage}% मन्द गति`;
      } else {
        return language === "en" ? "Stable Progress" : "स्थिर प्रगति";
      }
    }, [isTrendUp, isTrendDown, changePercentage, language]);

    const progressChange = React.useMemo(() => {
      if (sparklineData.length >= 2) {
        const currentVal =
          sparklineData[sparklineData.length - 1].annualProgress;
        const prevVal = sparklineData[sparklineData.length - 2].annualProgress;
        const diff = currentVal - prevVal;
        return diff !== 0 ? diff : null;
      } else if (
        sparklineData.length === 1 &&
        typeof indicator.baseline === "number"
      ) {
        const currentVal = sparklineData[0].annualProgress;
        const prevVal = indicator.baseline;
        const diff = currentVal - prevVal;
        return diff !== 0 ? diff : null;
      }
      return null;
    }, [sparklineData, indicator.baseline]);

    // Helper to retrieve detailed information for hovered sparkline points
    const getPointDetails = React.useCallback(
      (idx: number) => {
        if (sparklineData.length === 1) {
          if (idx === 0) {
            return {
              label: language === "en" ? "Baseline" : "प्रारम्भिक मान",
              value:
                typeof indicator.baseline === "number" ? indicator.baseline : 0,
            };
          } else {
            const date = sparklineData[0]?.updatedAt
              ? formatDisplayDate(sparklineData[0].updatedAt, language)
              : "";
            return {
              label: date || (language === "en" ? "Latest" : "पछिल्लो"),
              value: sparklineData[0]?.annualProgress || 0,
            };
          }
        } else {
          const dataItem = sparklineData[idx];
          const date = dataItem?.updatedAt
            ? formatDisplayDate(dataItem.updatedAt, language)
            : "";
          return {
            label:
              date || `${language === "en" ? "Point" : "बिन्दु"} ${idx + 1}`,
            value: dataItem?.annualProgress || 0,
          };
        }
      },
      [sparklineData, indicator.baseline, language],
    );

    // Mini sparkline data for last 3 historical data points
    const miniSparklineData = React.useMemo(() => {
      if (!updatesHistory || !indicator) return [];

      const extracted = updatesHistory
        .map((historyItem) => {
          const indSnap = historyItem.indicators?.find(
            (i) => i.id === indicator.id,
          );
          if (!indSnap) return null;

          return {
            annualProgress: indSnap.annualProgress || 0,
            updatedAt: indSnap.updatedAt || historyItem.createdAt || "",
          };
        })
        .filter((item): item is { annualProgress: number; updatedAt: string } => item !== null);

      const hasCurrentInHistory = extracted.some(
        (log) =>
          log.annualProgress === indicator.annualProgress &&
          new Date(log.updatedAt).toLocaleDateString() ===
            new Date(indicator.updatedAt || "").toLocaleDateString(),
      );

      if (!hasCurrentInHistory && indicator.updatedAt) {
        extracted.unshift({
          annualProgress: indicator.annualProgress,
          updatedAt: indicator.updatedAt,
        });
      }

      const sorted = extracted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      // Take last 3 updates and reverse to get oldest-to-newest chronological order
      return sorted.slice(0, 3).reverse();
    }, [indicator, updatesHistory]);

    const miniDisplayPoints = React.useMemo(() => {
      const points = miniSparklineData.map((d) => d.annualProgress);
      if (points.length === 0) {
        return [
          typeof indicator.baseline === "number" ? indicator.baseline : 0,
          indicator.annualProgress,
        ];
      }
      return points.length === 1
        ? [
            typeof indicator.baseline === "number" ? indicator.baseline : 0,
            points[0],
          ]
        : points;
    }, [miniSparklineData, indicator.baseline, indicator.annualProgress]);

    const minMiniVal = Math.min(...miniDisplayPoints);
    const maxMiniVal = Math.max(...miniDisplayPoints);
    const miniValRange =
      maxMiniVal - minMiniVal === 0 ? 1 : maxMiniVal - minMiniVal;

    const miniWidth = 44;
    const miniHeight = 14;
    const miniPadding = 1.5;

    const miniSvgPoints = React.useMemo(() => {
      return miniDisplayPoints.map((val, idx) => {
        const x =
          miniPadding +
          (idx / (miniDisplayPoints.length - 1 || 1)) *
            (miniWidth - 2 * miniPadding);
        const y =
          miniPadding +
          (1 - (val - minMiniVal) / miniValRange) *
            (miniHeight - 2 * miniPadding);
        return { x, y };
      });
    }, [miniDisplayPoints, minMiniVal, miniValRange]);

    const miniLinePath = React.useMemo(() => {
      return miniSvgPoints
        .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    }, [miniSvgPoints]);

    const isMiniTrendUp =
      miniDisplayPoints.length >= 2 &&
      miniDisplayPoints[miniDisplayPoints.length - 1] > miniDisplayPoints[miniDisplayPoints.length - 2];
    const isMiniTrendDown =
      miniDisplayPoints.length >= 2 &&
      miniDisplayPoints[miniDisplayPoints.length - 1] < miniDisplayPoints[miniDisplayPoints.length - 2];

    // Calculate Volatility of historical data points
    const volatilityMetrics = React.useMemo(() => {
      if (displayPoints.length < 2) return { isVolatile: false, score: 0 };

      const n = displayPoints.length;
      const mean = displayPoints.reduce((s, x) => s + x, 0) / n;
      const variance =
        displayPoints.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      const target = indicator.annualTarget || maxVal || 100;
      const stdDevScore = target > 0 ? (stdDev / target) * 100 : 0;

      // Calculate sequential differences
      const diffs: number[] = [];
      for (let i = 1; i < n; i++) {
        diffs.push(Math.abs(displayPoints[i] - displayPoints[i - 1]));
      }
      const pathLength = diffs.reduce((sum, val) => sum + val, 0);
      const netDistance = Math.abs(displayPoints[n - 1] - displayPoints[0]);

      // Check for zig-zag / directional switching
      // Highly volatile if we have at least 3 points, high path length relative to net distance (direction flips),
      // and the total path length is meaningful (at least 8% of target).
      const isZigZag =
        n >= 3 &&
        netDistance > 0 &&
        pathLength / netDistance > 1.4 &&
        pathLength > target * 0.08;

      // Highly volatile if either stdDevScore is very high (> 25%) or it is zig-zagging
      const isVolatile = stdDevScore > 25 || isZigZag;
      const score = Math.max(stdDevScore, isZigZag ? 35 : 0);

      return {
        isVolatile,
        score,
        stdDevScore,
        isZigZag,
      };
    }, [displayPoints, indicator.annualTarget, maxVal]);

    return (
      <motion.div
        ref={cardRef}
        style={{ scale, opacity, y }}
        className="relative w-full h-full"
      >
        <div className="relative w-full h-full overflow-hidden rounded-xl">
        {/* Swipe Action Backgrounds */}
        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
          {/* Swipe Right Background (revealed when dragging card right, dragOffset > 0) -> View History */}
          <div 
            className={`absolute inset-y-0 left-0 flex items-center pl-6 pr-10 transition-all duration-200 rounded-l-xl ${
              dragOffset > 80 
                ? "bg-amber-500 text-slate-950 w-[70%]" 
                : "bg-amber-500/10 text-amber-500 w-[50%] opacity-40"
            }`}
            style={{ 
              opacity: dragOffset > 5 ? Math.min(1, dragOffset / 80) : 0,
              pointerEvents: dragOffset > 5 ? "auto" : "none"
            }}
          >
            <div className="flex items-center gap-2.5">
              <History size={18} className={dragOffset > 80 ? "animate-bounce" : ""} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {language === "en" ? "View History" : "इतिहास हेर्नुहोस्"}
                </span>
                <span className="text-[8px] opacity-80 font-medium">
                  {dragOffset > 80 
                    ? (language === "en" ? "Release to view" : "हेर्नका लागि छोड्नुहोस्")
                    : (language === "en" ? "Swipe more" : "थप स्वाइप गर्नुहोस्")}
                </span>
              </div>
            </div>
          </div>

          {/* Swipe Left Background (revealed when dragging card left, dragOffset < 0) -> Track / Alert Bell */}
          <div 
            className={`absolute inset-y-0 right-0 flex items-center justify-end pr-6 pl-10 transition-all duration-200 rounded-r-xl ${
              dragOffset < -80 
                ? (isTracked ? "bg-rose-500 text-white w-[70%]" : "bg-emerald-500 text-slate-950 w-[70%]")
                : "bg-indigo-500/10 text-indigo-500 w-[50%] opacity-40"
            }`}
            style={{ 
              opacity: dragOffset < -5 ? Math.min(1, -dragOffset / 80) : 0,
              pointerEvents: dragOffset < -5 ? "auto" : "none"
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {isTracked 
                    ? (language === "en" ? "Untrack Alert" : "अनट्र्याक गर्नुहोस्")
                    : (language === "en" ? "Track Indicator" : "ट्र्याक गर्नुहोस्")}
                </span>
                <span className="text-[8px] opacity-80 font-medium">
                  {dragOffset < -80 
                    ? (language === "en" ? "Release to change" : "परिवर्तन गर्न छोड्नुहोस्")
                    : (language === "en" ? "Swipe more" : "थप स्वाइप गर्नुहोस्")}
                </span>
              </div>
              <Bell size={18} className={dragOffset < -80 ? "animate-pulse" : ""} />
            </div>
          </div>
        </div>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDrag={(event, info) => {
            const x = info.offset.x;
            setDragOffset(x);

            const threshold = 80;
            if (x < -threshold) {
              if (thresholdCrossedRef.current !== 'left') {
                thresholdCrossedRef.current = 'left';
                triggerHaptic('heavy');
              }
            } else if (x > threshold) {
              if (thresholdCrossedRef.current !== 'right') {
                thresholdCrossedRef.current = 'right';
                triggerHaptic('heavy');
              }
            } else {
              if (thresholdCrossedRef.current !== 'none') {
                thresholdCrossedRef.current = 'none';
                triggerHaptic('light');
              }
            }
          }}
          onDragEnd={(event, info) => {
            const threshold = 80;
            if (info.offset.x < -threshold) {
              if (onToggleTrack) {
                onToggleTrack();
                triggerHaptic('success');
              }
            } else if (info.offset.x > threshold) {
              if (onViewHistory) {
                onViewHistory(indicator);
                triggerHaptic('success');
              }
            }
            thresholdCrossedRef.current = 'none';
            setDragOffset(0);
          }}
          style={{
            x: dragOffset,
            ...glowStyles
          }}
          whileHover={
            showFastLook || showThresholdConfig
              ? undefined
              : {
                  scale: 1.02,
                  y: -2,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                }
          }
          whileTap={
            showFastLook || showThresholdConfig
              ? undefined
              : { scale: 0.98 }
          }
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          className={`${isHighImpact ? "bg-gradient-to-br from-indigo-500/10 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900" : "bg-white dark:bg-slate-900"} rounded-xl border transition-all duration-300 py-2.5 pl-4 pr-2.5 sm:py-5 sm:pl-6 sm:pr-5 relative flex flex-col justify-between h-full text-left select-none cursor-pointer ${
            isAlertActive
              ? highContrast ? "border-rose-600 dark:border-rose-400 border-2" : "border-rose-500/70 dark:border-rose-400/70 shadow-[0_0_25px_rgba(244,63,94,0.2)] hover:shadow-[0_0_35px_rgba(244,63,94,0.3)]"
              : isHighImpact
                ? highContrast ? "border-indigo-600 dark:border-indigo-400 border-2" : "border-indigo-500/80 dark:border-indigo-400/80 border-2 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                : highContrast ? "border-slate-400 dark:border-slate-500 border-1.5" : "border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
          }`}
          id={`indicator-card-${indicator.id}`}
          onClick={handleCardClick}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onContextMenu={(e) => {
            if (showFastLook) {
              e.preventDefault();
            }
          }}
        >
          {/* Category Vertical Stripe */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl z-20"
            style={{ backgroundColor: catColor.hex }}
            title={`${language === "en" ? "Category" : "श्रेणी"}: ${indicator.category}`}
          />
        
          {isHighImpact && !isAlertActive && (
            <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 z-[5] pointer-events-none">
              <div className="absolute top-3 -right-6 rotate-45 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest w-full py-1 text-center shadow-lg">
                {language === "en" ? "High Impact" : "उच्च प्रभाव"}
              </div>
            </div>
          )}
          {/* Pulsing Alert Glow Ring */}
          {isAlertActive && (
            <motion.div
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl border-2 border-rose-500/40 dark:border-rose-400/40 pointer-events-none z-[1]"
              style={{ filter: "drop-shadow(0px 0px 4px rgba(244,63,94,0.3))" }}
            />
          )}

          <AnimatePresence>
            {showThresholdConfig && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()} // Prevent card clicks
                className="absolute inset-0 bg-slate-900/98 dark:bg-slate-950/98 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between text-white z-[240] border border-amber-500/30 overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Sliders size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider font-sans">
                      {language === "en"
                        ? "Alert Threshold"
                        : "अलर्ट थ्रेसहोल्ड"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThresholdConfig(false);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Slider & Value */}
                <div className="flex-1 flex flex-col justify-center py-2 space-y-3">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold mb-1">
                      {language === "en"
                        ? "Current Alert Level"
                        : "हालको अलर्ट स्तर"}
                    </span>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {threshold !== null
                          ? `${threshold}%`
                          : language === "en"
                            ? "Disabled"
                            : "निष्क्रिय"}
                      </span>
                    </div>
                    {threshold !== null && (
                      <p className="text-[9px] text-slate-400 mt-1">
                        {language === "en"
                          ? `Triggers glow when progress is ≤ ${threshold}%`
                          : `प्रगति ≤ ${threshold}% हुँदा ग्लो ट्रिगर हुन्छ`}
                      </p>
                    )}
                  </div>

                  {/* Custom Slider Input */}
                  <div className="space-y-1 px-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={threshold !== null ? threshold : 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setThreshold(val);
                        localStorage.setItem(
                          `indicator-threshold-${indicator.id}`,
                          String(val),
                        );
                        if (onThresholdChange) {
                          onThresholdChange(indicator.id, val);
                        }
                      }}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold block">
                      {language === "en" ? "Quick Presets" : "द्रुत प्रिसेटहरू"}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {[30, 50, 80].map((preset) => (
                        <button
                          key={preset}
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreshold(preset);
                            localStorage.setItem(
                              `indicator-threshold-${indicator.id}`,
                              String(preset),
                            );
                            if (onThresholdChange) {
                              onThresholdChange(indicator.id, preset);
                            }
                          }}
                          className={`text-[8px] font-bold font-mono px-2 py-1 rounded-md transition-colors border cursor-pointer ${
                            threshold === preset
                              ? "bg-amber-500 text-slate-950 border-amber-400"
                              : "bg-white/5 text-slate-350 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreshold(null);
                          localStorage.removeItem(
                            `indicator-threshold-${indicator.id}`,
                          );
                          if (onThresholdChange) {
                            onThresholdChange(indicator.id, null);
                          }
                        }}
                        className={`text-[8px] font-bold px-2 py-1 rounded-md transition-colors border cursor-pointer ${
                          threshold === null
                            ? "bg-rose-500 text-white border-rose-400"
                            : "bg-white/5 text-rose-400 border-white/5 hover:bg-rose-950/20"
                        }`}
                      >
                        {language === "en"
                          ? "Disable Alert"
                          : "अलर्ट बन्द गर्नुहोस्"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Close Button at bottom */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThresholdConfig(false);
                  }}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {language === "en" ? "Save & Done" : "बचत गर्नुहोस्"}
                </button>
              </motion.div>
            )}
            {showFastLook && fastLookMetrics.hasData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 bg-slate-950/95 dark:bg-slate-950/98 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between text-white z-[250] border border-indigo-500/30 overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-indigo-400">
                    <Zap size={13} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider font-sans">
                      {language === "en"
                        ? "FAST-LOOK DELTA"
                        : "द्रुत-अवलोकन परिवर्तन"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[8px] bg-white/5 px-2 py-0.5 rounded-full font-bold">
                    <Eye size={10} />
                    <span>
                      {language === "en" ? "Quick Peek" : "द्रुत झलक"}
                    </span>
                  </div>
                </div>

                {/* Oldest vs Newest progression visualizer */}
                <div className="flex-1 flex flex-col justify-center py-2">
                  <div className="flex items-center justify-between gap-1 mb-3">
                    {/* Oldest/Baseline box */}
                    <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider text-center line-clamp-1">
                        {fastLookMetrics.oldestLabel}
                      </span>
                      <span className="text-base font-black font-mono text-slate-200 mt-1">
                        {fastLookMetrics.oldestVal}
                      </span>
                    </div>

                    {/* Flow Arrow */}
                    <motion.div
                      animate={{ x: [-2, 2, -2] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                      className="text-indigo-400/60 px-1"
                    >
                      <MoveRight size={13} />
                    </motion.div>

                    {/* Newest/Latest box */}
                    <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider text-center line-clamp-1">
                        {fastLookMetrics.newestLabel}
                      </span>
                      <span className="text-base font-black font-mono text-indigo-300 mt-1">
                        {fastLookMetrics.newestVal}
                      </span>
                    </div>
                  </div>

                  {/* Big Delta Display */}
                  <div className="flex flex-col items-center py-1">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                      {language === "en"
                        ? "Raw Numerical Delta"
                        : "कच्चा संख्यात्मक अन्तर"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-2xl font-black font-mono tracking-tight ${
                          fastLookMetrics.delta > 0
                            ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                            : fastLookMetrics.delta < 0
                              ? "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                              : "text-indigo-300"
                        }`}
                      >
                        {fastLookMetrics.delta > 0
                          ? `+${fastLookMetrics.delta}`
                          : fastLookMetrics.delta}
                      </span>
                      <span className="text-[9px] text-slate-300 font-bold">
                        {translateUnit(indicator.unit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtle instruction at the bottom */}
                <div className="border-t border-white/10 pt-2 flex items-center justify-center">
                  <span className="text-[7px] text-indigo-300/85 font-black tracking-widest uppercase animate-pulse">
                    {language === "en"
                      ? "• RELEASE TO DISMISS •"
                      : "• बन्द गर्न छोड्नुहोस् •"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* HEADER SECTION: Badges and Admin editing trigger */}
          <div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {confidenceBadge && (
                  <span
                    className={`text-[0.5rem] sm:text-[0.59375rem] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-0.5 sm:gap-1 ${confidenceBadge.color}`}
                    title={
                      language === "en"
                        ? "Data confidence score"
                        : "तथ्यांक विश्वास स्कोर"
                    }
                  >
                    <Zap size={7} sm:size={8} /> {confidenceBadge.label}
                  </span>
                )}
                {indicator.sdg && indicator.sdg !== "-" && (
                  <span
                    className={`text-[0.5rem] sm:text-[0.59375rem] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${getSdgColor(indicator.sdg)}`}
                  >
                    SDG {indicator.sdg}
                  </span>
                )}
                <span
                  className={`text-[0.5rem] sm:text-[0.59375rem] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border ${getPeriodColor(indicator.period)}`}
                >
                  {translatePeriod(indicator.period)}
                </span>
                <span
                  className={`text-[0.5rem] sm:text-[0.59375rem] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {/* ALERT ACTIVE ICON */}
                {isAlertActive && (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                    className="text-rose-500 dark:text-rose-400 mr-0.5 flex items-center justify-center pointer-events-none"
                    title={
                      language === "en"
                        ? `Alert: Progress is below threshold (${threshold}%)`
                        : `अलर्ट: प्रगति थ्रेसहोल्ड भन्दा कम छ (${threshold}%)`
                    }
                  >
                    <AlertTriangle size={14} className="fill-rose-500/20" />
                  </motion.div>
                )}
                {/* TRACK/ALERT BELL TOGGLE BUTTON */}
                {onToggleTrack && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTrack();
                      triggerHaptic('medium');
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                      isTracked
                        ? "bg-indigo-50/80 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40"
                        : "bg-transparent text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                    }`}
                    title={
                      isTracked
                        ? language === "en"
                          ? "Stop tracking / alerting"
                          : "ट्र्याकिङ / अलर्ट बन्द गर्नुहोस्"
                        : language === "en"
                          ? "Track indicator / enable alerts"
                          : "सूचक ट्र्याक गर्नुहोस् / अलर्ट सक्रिय गर्नुहोस्"
                    }
                    id={`track-btn-${indicator.id}`}
                  >
                    <Bell
                      size={14}
                      className={
                        isTracked ? "fill-indigo-600 dark:fill-indigo-400" : ""
                      }
                    />
                  </motion.button>
                )}
                {/* CUSTOM THRESHOLD BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThresholdConfig((prev) => !prev);
                    triggerHaptic('light');
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    threshold !== null
                      ? "bg-amber-50/85 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40"
                      : "bg-transparent text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                  }`}
                  title={
                    language === "en"
                      ? "Set alert threshold"
                      : "अलर्ट थ्रेसहोल्ड सेट गर्नुहोस्"
                  }
                  id={`threshold-btn-${indicator.id}`}
                >
                  <Sliders size={14} />
                </motion.button>
                {/* COMPACT MODE TOGGLE */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCompact((prev) => !prev);
                    triggerHaptic('light');
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    isCompact
                      ? "bg-indigo-50/85 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40"
                      : "bg-transparent text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                  }`}
                  title={
                    language === "en"
                      ? "Toggle compact mode"
                      : "कम्प्याक्ट मोड टगल गर्नुहोस्"
                  }
                  id={`compact-btn-${indicator.id}`}
                >
                  <Layout size={14} />
                </motion.button>
                {/* VIEW HISTORY TIMELINE DRAWER */}
                {onViewHistory && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(indicator);
                      triggerHaptic('medium');
                    }}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer"
                    title={
                      language === "en"
                        ? "More options"
                        : "थप विकल्पहरू"
                    }
                    id={`history-btn-${indicator.id}`}
                  >
                    <MoreHorizontal size={14} />
                  </motion.button>
                )}
                {/* INDICATOR COMMENTS MODAL TRIGGER */}
                {onOpenComments && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenComments(indicator);
                      triggerHaptic('medium');
                    }}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer"
                    title={
                      language === "en"
                        ? "Comments & notes"
                        : "टिप्पणी र छलफल"
                    }
                    id={`comments-btn-${indicator.id}`}
                  >
                    <MessageSquare size={14} />
                  </motion.button>
                )}
                {/* EDIT BUTTON TRIGGER FOR AUTHORIZED ROLES */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(indicator);
                      triggerHaptic('medium');
                    }}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer"
                     title="Edit progress"
                    id={`edit-btn-${indicator.id}`}
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* INDICATOR LABELS (NEPALI WITH ENGLISH PAIRINGS) */}
            <div className="mt-0.5 text-left min-h-[2.4rem] sm:min-h-[3.2rem] flex flex-col justify-start">
              <div className="flex items-start justify-between gap-1.5">
                <h4
                  className="text-[0.8125rem] sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 text-left"
                  title={primaryName}
                >
                  {highlightText(primaryName, searchQuery)}
                </h4>
                <div className="shrink-0 mt-0.5">
                  {isTrendUp && (
                    <TrendingUp
                      size={14}
                      className="text-emerald-500"
                    />
                  )}
                  {isTrendDown && (
                    <TrendingDown
                      size={14}
                      className="text-rose-500"
                    />
                  )}
                </div>
              </div>
              <p
                className="text-[0.5625rem] sm:text-[0.625rem] font-bold text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-1 text-left"
                title={secondaryName}
              >
                {highlightText(secondaryName, searchQuery)}
              </p>
            </div>
          </div>

          {/* METRIC GRIDS: TARGETS VS ACTUALS */}
          <div className={`mt-4 pt-3 border-t ${highContrast ? 'border-slate-300 dark:border-slate-600' : 'border-slate-50 dark:border-slate-800'}`}>
            <div className={`grid ${normalizeCategory(indicator.category) === 'Budget Utilization' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-2.5 mb-3 sm:mb-4 text-[0.625rem] sm:text-[0.6875rem]`}>
              {/* Baseline & Unit */}
              <div className="text-left flex flex-col justify-between">
                <span className="text-[0.5625rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-tight mb-0.5">
                  {t("baselineUnit")}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={String(indicator.baseline)}>
                  {indicator.baseline === "-" ? "-" : indicator.baseline}{" "}
                  <span className="text-[0.5625rem] text-slate-450 dark:text-slate-500 font-normal">
                    ({translateUnit(indicator.unit)})
                  </span>
                </span>
              </div>

              {/* Annual Plans */}
              <div className="text-left flex flex-col justify-between">
                <span className="text-[0.5625rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-tight mb-0.5">
                  {t("annualTarget")}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {indicator.annualTarget}{" "}
                  <span className="text-[0.5625rem] text-slate-450 dark:text-slate-500 font-normal">
                    ({translateUnit(indicator.unit)})
                  </span>
                </span>
              </div>

              {/* Cumulative Total Progress if applicable */}
              {hasTotalTarget && (
                <div className="text-left flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-tight mb-0.5">
                    {t("totalTarget")}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {indicator.totalTarget}
                  </span>
                </div>
              )}

              {hasTotalProgress && statusView === 'total' && (
                <div className="text-left flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-tight mb-0.5">
                    {t("totalProgress")}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {indicator.totalProgress}
                  </span>
                </div>
              )}
            </div>

            {/* PERFORMANCE TREND SPARKLINE */}
            {sparklineData.length > 0 && !actualIsCompact && (
              <div className={`mb-2 sm:mb-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 p-1.5 sm:p-2 rounded-xl border ${highContrast ? 'border-slate-300 dark:border-slate-600' : 'border-slate-100/30 dark:border-slate-800/40'}`}>
                <div className="text-left">
                  <span className="text-[0.53125rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-wider">
                    {language === "en"
                      ? "Performance Trend (Last 5)"
                      : "प्रगति प्रवृत्ति (अन्तिम ५)"}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isTrendUp ? (
                      <span className="text-[0.625rem] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 leading-none">
                        <TrendingUp size={11} className="shrink-0" />
                        {trendText}
                      </span>
                    ) : isTrendDown ? (
                      <span className="text-[0.625rem] font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-0.5 leading-none">
                        <TrendingDown size={11} className="shrink-0" />
                        {trendText}
                      </span>
                    ) : (
                      <span className="text-[0.625rem] font-bold text-slate-500 dark:text-slate-400 leading-none">
                        {trendText}
                      </span>
                    )}

                    {volatilityMetrics.isVolatile && (
                      <span
                        className="ml-1 px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[0.53125rem] font-bold uppercase tracking-wider border border-amber-500/20 flex items-center gap-0.5 shrink-0"
                        title={
                          language === "en"
                            ? "High variance or rapid changes in historical reports"
                            : "ऐतिहासिक रिपोर्टहरूमा उच्च उतार-चढ़ाव वा तीव्र परिवर्तनहरू"
                        }
                      >
                        <Activity size={8} className="animate-pulse shrink-0" />
                        {language === "en" ? "Volatile" : "अस्थिर"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sparkline Vector Graphic */}
                <motion.div
                  className="h-6 w-[100px] relative overflow-visible flex items-center"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                >
                  {hoveredPointIdx !== null &&
                    svgPoints[hoveredPointIdx] &&
                    (() => {
                      const details = getPointDetails(hoveredPointIdx);
                      const xPct = (svgPoints[hoveredPointIdx].x / width) * 100;
                      const isAnomaly =
                        anomalyIndices.includes(hoveredPointIdx);
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 24,
                          }}
                          className={`absolute bottom-full mb-2 ${
                            isAnomaly
                              ? "bg-amber-950/95 dark:bg-amber-950/95 border-amber-500/50 text-amber-200"
                              : "bg-slate-900/95 dark:bg-slate-950/95 border-slate-700/50 text-white"
                          } text-[9px] font-black font-mono px-2 py-0.5 rounded-md shadow-lg border backdrop-blur-sm pointer-events-none whitespace-nowrap z-[200] flex flex-col items-center gap-0.5 -translate-x-1/2`}
                          style={{ left: `${xPct}%` }}
                        >
                          <span
                            className={`text-[7px] font-bold leading-none ${isAnomaly ? "text-amber-400" : "text-slate-450"}`}
                          >
                            {details.label}
                          </span>
                          <span
                            className={`leading-none font-extrabold ${isAnomaly ? "text-amber-300 font-black" : "text-indigo-300"}`}
                          >
                            {details.value}
                          </span>
                          {isAnomaly && (
                            <span className="text-[6px] text-amber-500 dark:text-amber-400 font-extrabold uppercase tracking-widest leading-none mt-0.5 animate-pulse">
                              ⚠️ {language === "en" ? "OUTLIER" : "असंगति"}
                            </span>
                          )}
                        </motion.div>
                      );
                    })()}

                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    className="overflow-visible"
                  >
                    <defs>
                      <linearGradient
                        id={`sparkline-grad-${indicator.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            isTrendUp
                              ? "#10b981"
                              : isTrendDown
                                ? "#f43f5e"
                                : "#6366f1"
                          }
                          stopOpacity="0.25"
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            isTrendUp
                              ? "#10b981"
                              : isTrendDown
                                ? "#f43f5e"
                                : "#6366f1"
                          }
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Gradient Area */}
                    {areaPath && (
                      <motion.path
                        animate={{ d: areaPath }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        fill={`url(#sparkline-grad-${indicator.id})`}
                        stroke="none"
                      />
                    )}

                    {/* Volatility Glow Underlay */}
                    {linePath && volatilityMetrics.isVolatile && (
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0.15 }}
                        animate={{
                          pathLength: 1,
                          opacity: [0.15, 0.5, 0.15],
                          d: linePath,
                        }}
                        transition={{
                          pathLength: { duration: 1.1, ease: "easeOut" },
                          opacity: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                          },
                          d: { duration: 0.8, ease: "easeInOut" },
                        }}
                        fill="none"
                        stroke={
                          isTrendUp
                            ? "#10b981"
                            : isTrendDown
                              ? "#f43f5e"
                              : "#6366f1"
                        }
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          filter: `drop-shadow(0px 0px 4px ${isTrendUp ? "#10b981" : isTrendDown ? "#f43f5e" : "#6366f1"})`,
                        }}
                      />
                    )}

                    {/* Smooth Line Path */}
                    {linePath && (
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1, d: linePath }}
                        transition={{
                          pathLength: { duration: 1.1, ease: "easeOut" },
                          d: { duration: 0.8, ease: "easeInOut" },
                        }}
                        fill="none"
                        stroke={
                          isTrendUp
                            ? "#10b981"
                            : isTrendDown
                              ? "#f43f5e"
                              : "#6366f1"
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Anomaly Event Outlier Dots & Glow Halos */}
                    {svgPoints.map((p, idx) => {
                      const isAnomaly = anomalyIndices.includes(idx);
                      if (!isAnomaly) return null;

                      const isHovered = hoveredPointIdx === idx;

                      return (
                        <g
                          key={`anomaly-${idx}`}
                          className="pointer-events-none"
                        >
                          {/* Outer pulsing ring/halo for anomaly */}
                          <motion.circle
                            animate={{
                              cx: p.x,
                              cy: p.y,
                              scale: isHovered ? [1.1, 1.6, 1.1] : [1, 1.45, 1],
                              opacity: [0.6, 0.2, 0.6],
                            }}
                            r={isHovered ? "8" : "5.5"}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeOpacity="0.6"
                            transition={{
                              cx: {
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                              },
                              cy: {
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                              },
                              scale: {
                                repeat: Infinity,
                                duration: 1.8,
                                ease: "easeInOut",
                              },
                              opacity: {
                                repeat: Infinity,
                                duration: 1.8,
                                ease: "easeInOut",
                              },
                            }}
                          />
                          {/* Distinct core dot */}
                          {!isHovered && (
                            <motion.circle
                              animate={{ cx: p.x, cy: p.y }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                              }}
                              r="2.5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Pulsing Dot at the latest point */}
                    {svgPoints.length > 0 && hoveredPointIdx === null && (
                      <motion.circle
                        animate={{
                          cx: svgPoints[svgPoints.length - 1].x,
                          cy: svgPoints[svgPoints.length - 1].y,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        r="2.5"
                        fill={
                          anomalyIndices.includes(svgPoints.length - 1)
                            ? "#f59e0b"
                            : isTrendUp
                              ? "#10b981"
                              : isTrendDown
                                ? "#f43f5e"
                                : "#6366f1"
                        }
                      />
                    )}

                    {/* Active Highlight Dot */}
                    {hoveredPointIdx !== null && svgPoints[hoveredPointIdx] && (
                      <motion.circle
                        animate={{
                          cx: svgPoints[hoveredPointIdx].x,
                          cy: svgPoints[hoveredPointIdx].y,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        r="3.5"
                        fill={
                          anomalyIndices.includes(hoveredPointIdx)
                            ? "#f59e0b"
                            : isTrendUp
                              ? "#10b981"
                              : isTrendDown
                                ? "#f43f5e"
                                : "#6366f1"
                        }
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Transparent Interactive Hover/Touch Hitboxes */}
                    {svgPoints.map((p, idx) => {
                      const colWidth = width / (svgPoints.length || 1);
                      const xStart = idx === 0 ? 0 : p.x - colWidth / 2;
                      const xWidth =
                        idx === 0
                          ? p.x + colWidth / 2
                          : idx === svgPoints.length - 1
                            ? width - xStart
                            : colWidth;
                      return (
                        <rect
                          key={idx}
                          x={xStart}
                          y={0}
                          width={xWidth}
                          height={height}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => {
                        setHoveredPointIdx(idx);
                        triggerHaptic('light');
                      }}
                          onMouseLeave={() => setHoveredPointIdx(null)}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setHoveredPointIdx(idx);
                          }}
                          onTouchEnd={() => setHoveredPointIdx(null)}
                        />
                      );
                    })}
                  </svg>
                </motion.div>
              </div>
            )}

            {/* ANNUAL COMPLETION METER */}
            {statusView === 'annual' && (
            <div className={`space-y-1 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border ${highContrast ? 'border-slate-300 dark:border-slate-600' : 'border-slate-100/50 dark:border-slate-800/50'}`}>
              <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                  <span className="text-[0.5625rem] font-bold text-slate-400 dark:text-slate-500 font-sans uppercase tracking-tight">
                    {t("annualProgressTillNow")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistoricalTrend(!showHistoricalTrend);
                    }}
                    className={`text-[0.5625rem] font-bold uppercase tracking-tight ${
                      showHistoricalTrend ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {showHistoricalTrend ? (language === 'en' ? 'Hide Trend' : 'प्रवृत्ति लुकाउनुहोस्') : (language === 'en' ? 'Show Trend' : 'प्रवृत्ति देखाउनुहोस्')}
                  </button>
                  <span className="text-[0.6875rem] font-black text-slate-800 dark:text-slate-100 font-mono">
                    {indicator.annualProgress}
                    <span className="text-[0.5625rem] font-medium text-slate-450 dark:text-slate-500 mx-1">/</span>
                    <span className="text-[0.625rem] font-bold text-slate-500 dark:text-slate-400">
                      {indicator.annualTarget}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mini Sparkline visualizing the last 3 data points */}
                  {showHistoricalTrend && miniDisplayPoints.length >= 2 && (
                    <div
                      className="h-4 w-[38px] relative overflow-visible flex items-center"
                      title={
                        language === "en"
                          ? "Last 3 records trend"
                          : "अन्तिम ३ रेकर्ड प्रवृत्ति"
                      }
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${miniWidth} ${miniHeight}`}
                        className="overflow-visible"
                      >
                        {miniLinePath && (
                          <motion.path
                            d={miniLinePath}
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            fill="none"
                            stroke={
                              isMiniTrendUp
                                ? "#10b981"
                                : isMiniTrendDown
                                  ? "#f43f5e"
                                  : "#6366f1"
                            }
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        {miniSvgPoints.length > 0 && (
                          <circle
                            cx={miniSvgPoints[miniSvgPoints.length - 1].x}
                            cy={miniSvgPoints[miniSvgPoints.length - 1].y}
                            r="1.5"
                            fill={
                              isMiniTrendUp
                                ? "#10b981"
                                : isMiniTrendDown
                                  ? "#f43f5e"
                                  : "#6366f1"
                            }
                          />
                        )}
                      </svg>
                    </div>
                  )}

                  {progressChange !== null && (
                    <motion.span
                      key={`${indicator.id}-${indicator.annualProgress}`}
                      initial={{ opacity: 0, scale: 0.7, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`inline-flex items-center gap-0.5 font-black text-[9px] px-1.5 py-0.5 rounded-full ${
                        progressChange > 0
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20"
                      }`}
                    >
                      {progressChange > 0 ? (
                        <ArrowUp size={8} className="stroke-[3]" />
                      ) : (
                        <ArrowDown size={8} className="stroke-[3]" />
                      )}
                      {Math.abs(progressChange)}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Progress track */}
              <div className="flex items-center gap-2">
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/50 dark:ring-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(annualCompletionPercent, 100)}%`,
                    }}
                    transition={{ type: "spring", stiffness: 60, damping: 12 }}
                    className={`h-full rounded-full ${
                      annualCompletionPercent >= 100
                        ? "bg-emerald-500"
                        : annualCompletionPercent >= 50
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                    }`}
                  />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[0.625rem] font-black font-mono min-w-[28px] text-right ${
                    annualCompletionPercent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 
                    annualCompletionPercent >= 50 ? 'text-indigo-600 dark:text-indigo-400' : 
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    <AnimatedCounter value={annualCompletionPercent} />%
                  </span>
                  {indicator.annualTarget > indicator.annualProgress && (
                    <span className="text-[0.5rem] text-slate-400 font-mono whitespace-nowrap">
                      {indicator.annualTarget - indicator.annualProgress} {language === 'en' ? 'left' : 'बाँकी'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* HISTORICAL MILESTONES */}
            {sparklineData.length > 0 && !actualIsCompact && (
              <div className="mt-2.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-[0.5rem] text-slate-400 dark:text-slate-500 block font-sans uppercase tracking-wider mb-1">
                  {language === "en"
                    ? "Historical Milestones"
                    : "ऐतिहासिक माइलस्टोनहरू"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sparklineData.map((milestone, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md border ${highContrast ? 'border-slate-300 dark:border-slate-600' : 'border-slate-100 dark:border-white/5'} min-w-[44px]`}
                    >
                      <span className="text-[0.4375rem] text-slate-400 dark:text-slate-500 leading-none">
                        {formatDisplayDate(milestone.updatedAt, language)}
                      </span>
                      <span className="text-[0.5625rem] font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                        {milestone.annualProgress}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* METRICS TIMESTAMP AND AUTHOR FOOT NOTE */}
          {!actualIsCompact && indicator.updatedAt && (
            <div className={`mt-3.5 text-[0.5625rem] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t ${highContrast ? 'border-slate-300 dark:border-slate-600' : 'border-slate-50/55 dark:border-slate-800/50'} pt-2`}>
              <span className="truncate max-w-[120px]">
                {t("by")}: {indicator.gmail || indicator.updatedBy || (language === 'en' ? 'System' : 'प्रणाली')}
              </span>
              <span>{formatDisplayDate(indicator.updatedAt, language)}</span>
            </div>
          )}
        </motion.div>
        </div>
      </motion.div>
    );
  },
);
