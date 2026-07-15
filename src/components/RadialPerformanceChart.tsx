import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  PolarAngleAxis,
  LineChart,
  Line,
  YAxis,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  ReferenceArea,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Indicator, SystemMetadata } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  Info,
  X,
  Maximize,
  Minimize
} from "lucide-react";
import { getSectorForIndicator } from "../data";
import { HISTORICAL_DATA } from "../historicalData";
import { triggerHaptic } from "../utils/haptic";
import { DEFAULT_CATEGORY_THEMES } from "../utils/category";

const CriteriaBreakdown: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full mt-4">
    {data.map((item) => (
      <div key={item.categoryKey} className="flex flex-col items-center p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
        <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: item.fill }} />
        <span className="text-[8px] font-black uppercase text-slate-500 text-center truncate w-full">{item.name}</span>
        <span className="text-sm font-black text-slate-800 dark:text-white">
          {item.actualValue !== undefined ? item.actualValue : item.value}%
        </span>
      </div>
    ))}
  </div>
);

// ... rest of the file ...

interface RadialPerformanceChartProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  onHover: (name: string | null) => void;
  activeMetric: string | null;
  updatesHistory?: any[];
  isFocusMode?: boolean;
  onToggleFocusMode?: (focus: boolean) => void;
  isEmbedded?: boolean;
  viewMode?: string;
}

export const RadialPerformanceChart: React.FC<RadialPerformanceChartProps> = ({
  indicators,
  metadata,
  onHover,
  activeMetric,
  updatesHistory = [],
  isFocusMode = false,
  onToggleFocusMode,
  isEmbedded = false,
  viewMode,
}) => {
  const { language } = useLanguage();
  const [chartType, setChartType] = useState<"radial" | "bar" | "area">(
    "radial",
  );
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    if (chartType === "radial" && !selectedSector) {
      setIsZooming(true);
      setZoomTrigger((prev) => prev + 1);
      const timer = setTimeout(() => {
        setIsZooming(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [chartType, selectedSector, viewMode]);

  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (chartContainerRef.current?.requestFullscreen) {
        chartContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollThreshold = 180;
  // Compute scale and opacity for inline container when not in focus mode
  const scale = (isFocusMode || isFullscreen || isEmbedded) ? 1 : Math.max(0.65, 1 - (scrollY / 300));
  const opacity = (isFocusMode || isFullscreen || isEmbedded) ? 1 : Math.max(0, 1 - (scrollY / scrollThreshold));
  const pointerEvents = (isFocusMode || isFullscreen || isEmbedded) ? "auto" : (scrollY > scrollThreshold ? "none" : "auto");

  // Zoom state for Trends AreaChart (DEPRECATED - REMOVE IF NOT USED)
  // const [zoomData, setZoomData] = useState<{...}>({ ... });

  const [perfMode, setPerfMode] = useState<
    "strategic" | "weighted" | "INDICATOR"
  >("INDICATOR");
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPerfMode, setHoveredPerfMode] = useState<
    "strategic" | "weighted" | "INDICATOR" | null
  >(null);

  const [showInfoBalloon, setShowInfoBalloon] = useState(false);
  const balloonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerInfoBalloon = () => {
    setShowInfoBalloon(true);
    if (balloonTimeoutRef.current) {
      clearTimeout(balloonTimeoutRef.current);
    }
    balloonTimeoutRef.current = setTimeout(() => {
      setShowInfoBalloon(false);
    }, 8500); // 8.5 seconds to read
  };

  useEffect(() => {
    return () => {
      if (balloonTimeoutRef.current) {
        clearTimeout(balloonTimeoutRef.current);
      }
    };
  }, []);

  const getMethodologyDetails = () => {
    switch (perfMode) {
      case "strategic":
        return {
          title: language === "en" ? "Strategic Model" : "रणनीतिक ढाँचा",
          formula: language === "en" ? "Average of 5 Sector Achievements" : "५ क्षेत्रहरूको प्रगतिको औसत",
          description: language === "en" 
            ? "Calculates performance by finding the mean achievement across the 5 core thematic SDG sectors. This ensures high-level balance across all domains."
            : "५ वटा रणनीतिक क्षेत्रहरूको प्रगतिलाई समान प्राथमिकता दिई तिनको औसत निकालिन्छ। यसले समग्र विकासका आयामहरू सन्तुलित छन् भनी सुनिश्चित गर्दछ।",
          benefits: language === "en"
            ? ["Equal sector priority", "Thematic balance focus", "Ideal for long-term planning"]
            : ["समान क्षेत्रगत प्राथमिकता", "सन्तुलित नतिजा", "दीर्घकालीन योजनाका लागि उपयोगी"],
          color: "from-blue-500 to-indigo-500",
          iconColor: "text-blue-500"
        };
      case "weighted":
        return {
          title: language === "en" ? "Weighted Model" : "भारित ढाँचा",
          formula: "Σ(Progress * Weight) / ΣWeights",
          description: language === "en"
            ? "Applies specific weights (from 1 to 5) to each of the 17 individual indicators based on national priority and urgency."
            : "१७ वटा सूचकहरूको राष्ट्रिय प्राथमिकता र संवेदनशीलताका आधारमा (१ देखि ५ सम्म) तोकिएको भार अनुसार कुल प्रगतिको मापन गरिन्छ।",
          benefits: language === "en"
            ? ["Urgency-based weighting", "Realistic impact tracking", "Reflects policy focus"]
            : ["संवेदनशीलतामा आधारित भार", "यथार्थपरक प्रभाव मापन", "नीतिगत प्राथमिकता प्रतिबिम्बित"],
          color: "from-amber-500 to-orange-500",
          iconColor: "text-amber-500"
        };
      case "INDICATOR":
      default:
        return {
          title: language === "en" ? "Indicator Model" : "साधारण ढाँचा",
          formula: language === "en" ? "Arithmetic Mean of 17 Indicators" : "१७ सूचकहरूको अंकगणितीय औसत",
          description: language === "en"
            ? "A simple, transparent average where all 17 SDG-aligned indicators carry equal importance, regardless of sector or weighting."
            : "सबै १७ सूचकहरूलाई समान प्राथमिकता दिई सरल र पारदर्शी अंकगणितीय औसत निकालिन्छ। यसमा क्षेत्र वा भारको कुनै भिन्नता हुँदैन।",
          benefits: language === "en"
            ? ["Maximum transparency", "Simple baseline assessment", "Unweighted indicator parity"]
            : ["उच्चतम पारदर्शिता", "सरल आधारभूत मूल्यांकन", "सबै सूचकहरूको समान हिस्सा"],
          color: "from-emerald-500 to-teal-500",
          iconColor: "text-emerald-500"
        };
    }
  };

  const currentMethodology = getMethodologyDetails();

  // Helper function to calculate weighted achievement for a set of indicators
  const calculateCategoryAchievement = (
    categoryIndicators: Indicator[],
    mode: "weighted" | "INDICATOR" = "weighted",
  ) => {
    if (categoryIndicators.length === 0) return 0;

    if (mode === "INDICATOR") {
      const totalAchievement = categoryIndicators.reduce((acc, curr) => {
        const target = curr.annualTarget || 0;
        const progress = curr.annualProgress || 0;
        const achievement =
          target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return acc + achievement;
      }, 0);
      return Math.round(totalAchievement / categoryIndicators.length);
    }

    const catTotalWeight = categoryIndicators.reduce(
      (acc, curr) => acc + (curr?.weight || 0),
      0,
    );
    if (catTotalWeight === 0) {
      return calculateCategoryAchievement(categoryIndicators, "INDICATOR");
    }

    const catAchievedWeight = categoryIndicators.reduce((acc, curr) => {
      if (!curr) return acc;
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement =
        target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + achievement * (curr.weight || 0);
    }, 0);

    return Math.round(catAchievedWeight / catTotalWeight);
  };

  // Helper to calculate historical sector achievements dynamically
  const getSectorHistoryPoints = (categoryName: string, currentVal: number) => {
    const histPoints = HISTORICAL_DATA.map((h) => {
      const sectorIndicators = h.indicators.filter((ind) => {
        const fullIndicator = indicators.find(i => i.id === ind.id) || indicators.find(i => i.name === ind.name);
        return getSectorForIndicator(ind.name, (fullIndicator as any)?.sdg) === categoryName;
      });
      if (sectorIndicators.length === 0) return null;

      const totalWeight = sectorIndicators.reduce(
        (sum, ind) => {
          const fullIndicator = indicators.find(i => i.id === ind.id) || indicators.find(i => i.name === ind.name);
          return sum + ((fullIndicator as any)?.weight || 0);
        },
        0,
      );
      if (totalWeight === 0) {
        const totalAchievement = sectorIndicators.reduce((sum, ind) => {
          const target = ind.annualTarget || 0;
          const progress = ind.annualProgress || 0;
          return (
            sum + (target > 0 ? Math.min((progress / target) * 100, 100) : 0)
          );
        }, 0);
        return Math.round(totalAchievement / sectorIndicators.length);
      }

      const achievedWeight = sectorIndicators.reduce((sum, ind) => {
        const fullIndicator = indicators.find(i => i.id === ind.id) || indicators.find(i => i.name === ind.name);
        const target = ind.annualTarget || 0;
        const progress = ind.annualProgress || 0;
        const achievement =
          target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return sum + achievement * ((fullIndicator as any)?.weight || 0);
      }, 0);

      return Math.round(achievedWeight / totalWeight);
    }).filter((v) => v !== null) as number[];

    const points: { value: number }[] = [{ value: 0 }]; // start baseline at 0
    histPoints.forEach((val) => {
      points.push({ value: val });
    });
    points.push({ value: currentVal });
    return points.slice(-5); // keep last 5 points
  };

  // Group indicators by the 5 strategic sectors
  const infraIndicators = indicators.filter(
    (i) => i.category === "Infrastructure Creation",
  );
  const maintenanceIndicators = indicators.filter(
    (i) => i.category === "Maintenance",
  );
  const employmentIndicators = indicators.filter(
    (i) => i.category === "Employment Creation",
  );
  const budgetIndicators = indicators.filter(
    (i) => i.category === "Budget Utilization",
  );
  const governanceIndicators = indicators.filter(
    (i) => i.category === "Governance",
  );

  const getSectorAchievements = (mode: "strategic" | "weighted" | "INDICATOR") => {
    const m = mode === "INDICATOR" ? "INDICATOR" : "weighted";
    return {
      infra: calculateCategoryAchievement(infraIndicators, m),
      maintenance: calculateCategoryAchievement(maintenanceIndicators, m),
      employment: calculateCategoryAchievement(employmentIndicators, m),
      budget: calculateCategoryAchievement(budgetIndicators, m),
      governance: calculateCategoryAchievement(governanceIndicators, m),
    };
  };

  const currentSectorAchievements = React.useMemo(() => getSectorAchievements(perfMode), [indicators, perfMode]);
  const hoveredSectorAchievements = React.useMemo(() => hoveredPerfMode ? getSectorAchievements(hoveredPerfMode) : null, [indicators, hoveredPerfMode]);

  const displaySectorAchievements = hoveredSectorAchievements || currentSectorAchievements;

  // Overall Weighted Performance (Across all 17)
  const totalWeightedAchievement = React.useMemo(() => {
    const totalWeight = indicators.reduce(
      (acc, curr) => acc + (curr?.weight || 0),
      0,
    );
    if (totalWeight === 0) return 0;
    const achievedWeight = indicators.reduce((acc, curr) => {
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement =
        target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + achievement * (curr.weight || 0);
    }, 0);
    return Math.round(achievedWeight / totalWeight);
  }, [indicators]);

  // Overall INDICATOR Average (Across all 17)
  const totalIndicatorAchievement = React.useMemo(() => {
    if (indicators.length === 0) return 0;
    const totalAchievement = indicators.reduce((acc, curr) => {
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement =
        target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + achievement;
    }, 0);
    return Math.round(totalAchievement / indicators.length);
  }, [indicators]);

  const getAverageForMode = (mode: "strategic" | "weighted" | "INDICATOR") => {
    if (mode === "strategic") {
      const sectors = getSectorAchievements(mode);
      return Math.round(
        (sectors.infra +
          sectors.maintenance +
          sectors.employment +
          sectors.budget +
          sectors.governance) /
          5,
      );
    }
    return mode === "weighted" ? totalWeightedAchievement : totalIndicatorAchievement;
  };

  const average = getAverageForMode(perfMode);
  const displayAverage = hoveredPerfMode ? getAverageForMode(hoveredPerfMode) : average;

  const [hoveredChartSector, setHoveredChartSector] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const getChartDataForMode = (mode: "strategic" | "weighted" | "INDICATOR") => {
    const sectors = getSectorAchievements(mode);
    const rawData = [
      {
        name: language === "en" ? "Infrastructure Creation" : "भौतिक पूर्वाधार निर्माण",
        categoryKey: "Infrastructure Creation",
        value: sectors.infra,
        fill: metadata?.categoryThemes?.["Infrastructure Creation"] || DEFAULT_CATEGORY_THEMES["Infrastructure Creation"],
        indicatorCount: indicators.filter(i => i.category === "Infrastructure Creation").length,
        categoryAchievement: Math.round(indicators.filter(i => i.category === "Infrastructure Creation").reduce((acc, curr) => acc + (curr.annualTarget > 0 ? Math.min((curr.annualProgress || 0) / curr.annualTarget * 100, 100) : 0) * (curr.weight || 0), 0) / (indicators.filter(i => i.category === "Infrastructure Creation").reduce((acc, curr) => acc + (curr.weight || 0), 0) || 1))
      },
      {
        name: language === "en" ? "Road Maintenance" : "सडक मर्मतसम्भार",
        categoryKey: "Maintenance",
        value: sectors.maintenance,
        fill: metadata?.categoryThemes?.["Maintenance"] || DEFAULT_CATEGORY_THEMES["Maintenance"],
        indicatorCount: indicators.filter(i => i.category === "Maintenance").length,
        categoryAchievement: Math.round(indicators.filter(i => i.category === "Maintenance").reduce((acc, curr) => acc + (curr.annualTarget > 0 ? Math.min((curr.annualProgress || 0) / curr.annualTarget * 100, 100) : 0) * (curr.weight || 0), 0) / (indicators.filter(i => i.category === "Maintenance").reduce((acc, curr) => acc + (curr.weight || 0), 0) || 1))
      },
      {
        name: language === "en" ? "Employment Creation" : "रोजगारी सिर्जना",
        categoryKey: "Employment Creation",
        value: sectors.employment,
        fill: metadata?.categoryThemes?.["Employment Creation"] || DEFAULT_CATEGORY_THEMES["Employment Creation"],
        indicatorCount: indicators.filter(i => i.category === "Employment Creation").length,
        categoryAchievement: Math.round(indicators.filter(i => i.category === "Employment Creation").reduce((acc, curr) => acc + (curr.annualTarget > 0 ? Math.min((curr.annualProgress || 0) / curr.annualTarget * 100, 100) : 0) * (curr.weight || 0), 0) / (indicators.filter(i => i.category === "Employment Creation").reduce((acc, curr) => acc + (curr.weight || 0), 0) || 1))
      },
      {
        name: language === "en" ? "Budget Utilization" : "बजेट उपयोगिता",
        categoryKey: "Budget Utilization",
        value: sectors.budget,
        fill: metadata?.categoryThemes?.["Budget Utilization"] || DEFAULT_CATEGORY_THEMES["Budget Utilization"],
        indicatorCount: indicators.filter(i => i.category === "Budget Utilization").length,
        categoryAchievement: Math.round(indicators.filter(i => i.category === "Budget Utilization").reduce((acc, curr) => acc + (curr.annualTarget > 0 ? Math.min((curr.annualProgress || 0) / curr.annualTarget * 100, 100) : 0) * (curr.weight || 0), 0) / (indicators.filter(i => i.category === "Budget Utilization").reduce((acc, curr) => acc + (curr.weight || 0), 0) || 1))
      },
      {
        name: language === "en" ? "Governance & Auditing" : "सुशासन र संस्थागत सबलीकरण",
        categoryKey: "Governance",
        value: sectors.governance,
        fill: metadata?.categoryThemes?.["Governance"] || DEFAULT_CATEGORY_THEMES["Governance"],
        indicatorCount: indicators.filter(i => i.category === "Governance").length,
        categoryAchievement: Math.round(indicators.filter(i => i.category === "Governance").reduce((acc, curr) => acc + (curr.annualTarget > 0 ? Math.min((curr.annualProgress || 0) / curr.annualTarget * 100, 100) : 0) * (curr.weight || 0), 0) / (indicators.filter(i => i.category === "Governance").reduce((acc, curr) => acc + (curr.weight || 0), 0) || 1))
      },
    ].reverse();

    return rawData.map(item => {
      const isZero = item.value === 0;
      return {
        ...item,
        value: isZero ? 1 : item.value,
        actualValue: item.value,
      };
    });
  };

  const chartData = React.useMemo(() => {
    return getChartDataForMode(perfMode).map((item, index) => ({
      ...item,
      history: getSectorHistoryPoints(item.categoryKey, item.actualValue !== undefined ? item.actualValue : item.value),
    }));
  }, [indicators, language, perfMode]);

  const displayChartData = hoveredPerfMode ? getChartDataForMode(hoveredPerfMode) : chartData;

  // Time-series data for trends view - Using real updatesHistory if available
  const timeSeriesTrendData = React.useMemo(() => {
    // Start with a very early baseline
    const baseline = { date: "2082/01/01", value: 0 };

    // Process updatesHistory - reverse to get chronological order
    const historyPoints = (updatesHistory || [])
      .filter((h) => h.metadata?.totalWeightProgress !== undefined)
      .map((h) => ({
        date: h.lastUpdateDate || h.id || "N/A",
        value: h.metadata.totalWeightProgress,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fallback to static HISTORICAL_DATA if no history found
    const dataPoints =
      historyPoints.length > 0
        ? historyPoints
        : HISTORICAL_DATA.map((h) => ({
            date: h.lastUpdateDate,
            value: h.metadata.totalWeightProgress,
          }));

    const current = {
      date: metadata?.lastUpdateDate || "2083/02/15",
      value: average,
    };

    // Combine and ensure unique dates for XAxis stability
    const combined = [baseline, ...dataPoints, current];
    const uniqueMap = new Map();
    combined.forEach((p) => uniqueMap.set(p.date, p.value));

    return Array.from(uniqueMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [average, metadata, updatesHistory]);

  // const zoom = () => { ... };

  // const zoomOut = () => { ... };

  const filteredIndicators = selectedSector
    ? indicators.filter((i) => i && i.category === selectedSector)
    : [];
  const drillDownData = filteredIndicators.map((ind, index) => {
    if (!ind) return { name: '', value: 0, achievement: 0, isDrillDown: true, fill: '#000' };
    const target = ind.annualTarget || 0;
    const progress = ind.annualProgress || 0;
    const achievement = target > 0 ? Math.min(Math.round((progress / target) * 100), 100) : 0;
    return {
      name: language === "en" ? (ind.nameEn || ind.name || '') : (ind.name || ''),
      value: ind.weight || 0,
      achievement,
      isDrillDown: true,
      fill: ["#2563eb", "#10b981", "#f59e0b", "#4f46e5", "#8b5cf6"][index % 5]
    };
  });

  const weightedBreakdown = React.useMemo(() => {
    const totalWeight = indicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0);
    if (totalWeight === 0) return [];

    const categories = [
      { key: "Infrastructure Creation", nameEn: "Infrastructure Creation", nameNe: "भौतिक पूर्वाधार निर्माण", color: "#3b82f6" },
      { key: "Maintenance", nameEn: "Road Maintenance", nameNe: "सडक मर्मतसम्भार", color: "#10b981" },
      { key: "Employment Creation", nameEn: "Employment Creation", nameNe: "रोजगारी सिर्जना", color: "#f59e0b" },
      { key: "Budget Utilization", nameEn: "Budget Utilization", nameNe: "बजेट उपयोगिता", color: "#6366f1" },
      { key: "Governance", nameEn: "Governance & Auditing", nameNe: "सुशासन र संस्थागत सबलीकरण", color: "#a855f7" }
    ];

    return categories.map(cat => {
      const catIndicators = indicators.filter(i => i.category === cat.key);
      const catWeight = catIndicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0);
      const catAchievedWeight = catIndicators.reduce((acc, curr) => {
        const target = curr.annualTarget || 0;
        const progress = curr.annualProgress || 0;
        const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
        return acc + achievement * (curr.weight || 0);
      }, 0);

      const categoryAchievement = catWeight > 0 ? Math.round(catAchievedWeight / catWeight) : 0;
      const contributionPoints = totalWeight > 0 ? (catAchievedWeight / totalWeight) : 0;
      const weightShare = totalWeight > 0 ? Math.round((catWeight / totalWeight) * 100) : 0;

      return {
        key: cat.key,
        name: language === "en" ? cat.nameEn : cat.nameNe,
        color: cat.color,
        categoryWeight: catWeight,
        categoryAchievement,
        contributionPoints: Number(contributionPoints.toFixed(1)),
        weightShare,
        indicatorCount: catIndicators.length
      };
    });
  }, [indicators, language]);

  useLayoutEffect(() => {
    if (chartContainerRef.current) {
      // Animate the container when chart type changes to prevent visual jarring
      gsap.fromTo(
        chartContainerRef.current,
        {
          opacity: 0,
          scale: 0.98,
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          clearProps: "filter",
        },
      );

      // Also animate children sequentially if possible
      const children = chartContainerRef.current.querySelectorAll(
        ".recharts-surface, .recharts-responsive-container",
      );
      if (children.length > 0) {
        gsap.fromTo(
          children,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: "back.out(1.7)",
          },
        );
      }
    }
  }, [chartType, selectedSector]);

  const EnhancedTooltip = ({ active, payload, label }: any) => {
    const chartEl = document.getElementById("radial-chart-container");

    if (active && payload && payload.length && chartEl) {
      const data = payload[0].payload;
      const value = data.actualValue !== undefined ? data.actualValue : payload[0].value;
      const name = data.name || label;
      
      const isDrilldownItem = !!data.isDrillDown;

      return createPortal(
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[100] pointer-events-none transition-all duration-300 ease-out">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-slate-900/95 dark:bg-slate-800/95 text-white px-3 py-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md flex flex-col gap-0.5 ring-1 ring-black/5 select-none"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[140px] truncate">
              {name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white leading-none">
                {value}%
              </span>
              {(data.indicatorCount !== undefined && !isNaN(data.indicatorCount)) ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold whitespace-nowrap">
                  {language === 'en' ? `${data.indicatorCount} Indicators` : `${data.indicatorCount} सूचकहरू`}
                </span>
              ) : isDrilldownItem && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold whitespace-nowrap">
                  {language === 'en' ? `Achievement: ${data.achievement}%` : `प्रगति: ${data.achievement}%`}
                </span>
              )}
              {(data.categoryAchievement !== undefined && !isNaN(data.categoryAchievement)) && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold whitespace-nowrap">
                  {language === 'en' ? `Achieved: ${data.categoryAchievement}%` : `प्रगति: ${data.categoryAchievement}%`}
                </span>
              )}
            </div>
          </motion.div>
        </div>,
        chartEl
      );
    }
    return null;
  };

  return (
    <>
      <motion.div
        layout
        id="radial-chart-container"
        ref={chartContainerRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: opacity, 
          scale: scale,
          y: 0
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 30,
          mass: 0.8
        }}
        style={{ 
          pointerEvents,
          transformOrigin: "center top"
        }}
        onMouseLeave={() => onHover(null)}
        className={`${
          isEmbedded
            ? 'bg-transparent border-none ring-0 shadow-none p-0'
            : isFullscreen
              ? 'rounded-none border-none ring-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-2.5 xs:p-3 sm:p-6 lg:p-10'
              : 'rounded-[36px] border border-slate-200/60 dark:border-white/10 ring-1 ring-white/50 dark:ring-white/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-2.5 xs:p-3 sm:p-6 lg:p-10'
        } shadow-2xl shadow-indigo-500/5 dark:shadow-black/60 relative overflow-hidden h-full flex flex-col items-center justify-center gap-2 xs:gap-3 sm:gap-10 w-full`}
      >
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2">
          {isFocusMode && !isEmbedded && onToggleFocusMode && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (isFullscreen) document.exitFullscreen?.();
                onToggleFocusMode(false);
              }}
              className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:scale-125 transition-transform animate-pulse" />
              {language === "en" ? "Show Dashboard" : "ड्यासबोर्ड देखाउनुहोस्"}
            </button>
          )}
        </div>

        {isFocusMode && !isEmbedded && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-40 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
            {language === "en" ? "Performance Focus" : "विशेष ध्यान केन्द्रित"}
          </div>
        )}

        <div className="flex flex-col w-full items-center gap-4 sm:gap-6">
          {/* Controls Header - Top Right */}
          <div className="flex w-full justify-between items-center px-2">
             <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/40 rounded-xl shadow-inner border border-slate-200/50 dark:border-white/5">
                <button
                    onClick={() => {
                        setPerfMode("strategic");
                        triggerHaptic('light');
                        triggerInfoBalloon();
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${perfMode === "strategic" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-black/5" : "text-slate-500"}`}
                >
                    {language === "en" ? "Strategic" : "रणनीतिक"}
                </button>
                <button
                    onClick={() => {
                        setPerfMode("weighted");
                        triggerHaptic('light');
                        triggerInfoBalloon();
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${perfMode === "weighted" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-black/5" : "text-slate-500"}`}
                >
                    {language === "en" ? "Weighted" : "भारित"}
                </button>
                <button
                    onClick={() => {
                        setPerfMode("INDICATOR");
                        triggerHaptic('light');
                        triggerInfoBalloon();
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${perfMode === "INDICATOR" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md ring-1 ring-black/5" : "text-slate-500"}`}
                >
                    {language === "en" ? "Indicator" : "साधारण"}
                </button>
                <button
                    onMouseEnter={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        setShowInfoBalloon(true);
                    }}
                    onMouseLeave={() => setShowInfoBalloon(false)}
                    className="px-2 py-1 rounded-lg text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center"
                    title={language === "en" ? "Calculation methodology info" : "गणना विधिको जानकारी"}
                >
                    <Info size={14} />
                </button>
             </div>

             <div className="flex gap-2">
                <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setChartType(
                        chartType === "radial"
                          ? "bar"
                          : chartType === "bar"
                            ? "area"
                            : "radial",
                      );
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all shadow-md border border-slate-200/50"
                  >
                    {chartType === "radial" ? (
                      <BarChart2 size={16} />
                    ) : chartType === "bar" ? (
                      <Activity size={16} />
                    ) : (
                      <PieChartIcon size={16} />
                    )}
                  </button>

             </div>
          </div>

          {/* Chart Area */}
          <div className="relative w-full aspect-square flex items-center justify-center">
            {/* Balloon Popover */}
            <AnimatePresence>
              {showInfoBalloon && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-16 right-4 z-50 w-60 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col pointer-events-auto"
                >
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">{currentMethodology.title}</h4>
                     <button onClick={() => setShowInfoBalloon(false)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300">{currentMethodology.description}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mouse following "More Info" tooltip */}
            <AnimatePresence>
              {hoveredSector && !selectedSector && (() => {
                const hoveredData = displayChartData.find((d: any) => d.categoryKey === hoveredSector);
                if (!hoveredData) return null;
                const indCount = indicators.filter((i: any) => i.category === hoveredSector).length;
                const progress = hoveredData.actualValue !== undefined ? hoveredData.actualValue : hoveredData.value;
                const gap = Math.max(0, 100 - progress);

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute z-[100] pointer-events-none w-52 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-2"
                    style={{ 
                      left: mousePos.x, 
                      top: mousePos.y,
                      transform: 'translate(-50%, -110%)' 
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredData.fill }} />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
                        {hoveredData.name}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">{language === 'en' ? 'Indicators' : 'सूचकहरू'}</span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{indCount}</span>
                      </div>
                      <div className="flex flex-col bg-indigo-50 dark:bg-indigo-900/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                        <span className="text-[8px] text-indigo-500 font-bold uppercase">{language === 'en' ? 'Progress' : 'प्रगति'}</span>
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">{progress}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{language === 'en' ? 'Remaining Gap' : 'बाँकी'}</span>
                        <span className="text-[10px] font-black text-rose-500">{gap}%</span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {selectedSector ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <button
                  onClick={() => {
                    setSelectedSector(null);
                    triggerHaptic('medium');
                  }}
                  className="absolute top-0 left-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 text-indigo-600 dark:text-indigo-400 group"
                  title={language === "en" ? "Go back" : "पछाडि जानुहोस्"}
                >
                  <Activity size={14} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{language === 'en' ? 'Back' : 'पछाडि'}</span>
                </button>
                {selectedSector && (
                  <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartData.find(d => d.categoryKey === selectedSector)?.fill }} />
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200">
                      {chartData.find(d => d.categoryKey === selectedSector)?.name}
                    </span>
                    <span className="text-[10px] font-black text-indigo-500">
                      {(() => {
                        const item = chartData.find(d => d.categoryKey === selectedSector);
                        return item ? (item.actualValue !== undefined ? item.actualValue : item.value) : 0;
                      })()}%
                    </span>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    onMouseMove={(e: any) => {
                      if (e && e.chartX !== undefined) {
                        setMousePos({ x: e.chartX, y: e.chartY });
                      }
                    }}
                  >
                    <Pie
                      data={drillDownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={5}
                      className="cursor-pointer"
                      onClick={() => triggerHaptic('light')}
                    >
                      {drillDownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip offset={40} content={<EnhancedTooltip />} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : chartType === "radial" ? (
              <motion.div
                key={`radial-chart-zoom-${zoomTrigger}`}
                initial={{ scale: 0.85, opacity: 0, rotate: -15, filter: "blur(6px)" }}
                animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 18, 
                  mass: 0.8,
                  delay: 0.05
                }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="85%"
                    barSize={14}
                    data={displayChartData}
                    startAngle={90}
                    endAngle={-270}
                    onMouseMove={(e: any) => {
                      if (e && e.chartX !== undefined) {
                        setMousePos({ x: e.chartX, y: e.chartY });
                      }
                    }}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <Legend 
                      iconSize={10} 
                      wrapperStyle={{ fontSize: '11px' }}
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      payload={
                        [...displayChartData].reverse().map((item) => ({
                          id: item.name,
                          type: 'circle',
                          value: item.name,
                          color: item.fill,
                        }))
                      }
                    />
                    <RadialBar
                      background={{ fill: "rgba(0,0,0,0.1)" }}
                      dataKey="value"
                      cornerRadius={10}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                      onMouseEnter={(data: any) => setHoveredSector(data.categoryKey)}
                      onMouseLeave={() => setHoveredSector(null)}
                      onClick={(data: any) => {
                        setSelectedSector(data.categoryKey);
                        triggerHaptic('medium');
                      }}
                      className="cursor-pointer"
                      style={{
                        transition: "all 0.3s ease",
                      }}
                    />
                    <Tooltip
                      offset={40}
                      cursor={false}
                      content={<EnhancedTooltip />}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : chartType === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={[...displayChartData].reverse()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onMouseMove={(e: any) => {
                      if (e && e.chartX !== undefined) {
                        setMousePos({ x: e.chartX, y: e.chartY });
                      }
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(0,0,0,0.05)"
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                        offset={40}
                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                        content={<EnhancedTooltip />}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                      className="cursor-pointer"
                      onMouseEnter={(data: any) => setHoveredSector(data.categoryKey)}
                      onMouseLeave={() => setHoveredSector(null)}
                      onClick={(data: any) => {
                        setSelectedSector(data.categoryKey);
                        triggerHaptic('medium');
                      }}
                    >
                        {[...displayChartData].reverse().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill} 
                              className="hover:opacity-80 transition-opacity duration-300"
                            />
                        ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeSeriesTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(0,0,0,0.05)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 8, fill: "#94a3b8" }}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip offset={40} content={<EnhancedTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      fill="url(#colorProgress)"
                      fillOpacity={1}
                      strokeWidth={3}
                      animationDuration={300}
                    />
                    <defs>
                      <linearGradient
                        id="colorProgress"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
            )}
            
            {/* Zoom focus ripples */}
            <AnimatePresence>
              {isZooming && chartType === "radial" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="absolute w-24 h-24 rounded-full border border-indigo-500/40 dark:border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  />
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0.5 }}
                    animate={{ scale: 3.2, opacity: 0 }}
                    transition={{ duration: 1.3, ease: "easeOut", delay: 0.15 }}
                    className="absolute w-24 h-24 rounded-full border border-violet-500/30 dark:border-violet-400/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                  />
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0.3 }}
                    animate={{ scale: 4.2, opacity: 0 }}
                    transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
                    className="absolute w-24 h-24 rounded-full border border-pink-500/10 dark:border-pink-400/10"
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Central Achievement Number */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
              <motion.div 
                key={`${displayAverage}-${zoomTrigger}`}
                initial={{ scale: 0.3, opacity: 0, filter: "blur(10px)" }}
                animate={{ 
                  scale: [0.3, 1.45, 0.93, 1.05, 1], 
                  opacity: 1, 
                  filter: "blur(0px)" 
                }}
                transition={{ 
                  duration: 1.4, 
                  times: [0, 0.35, 0.65, 0.85, 1],
                  ease: "easeOut"
                }}
                className="flex items-baseline justify-center"
              >
                <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-none tracking-tight">
                  {displayAverage}
                </span>
                <span className="text-sm sm:text-base font-black text-indigo-500 ml-0.5">%</span>
              </motion.div>
            </div>

          </div>

          {!selectedSector && <CriteriaBreakdown data={[...displayChartData].reverse()} />}

        </div>

    </motion.div>

    {/* Floating Mini Widget at top right corner when scrolled down */}
    <AnimatePresence>
      {scrollY > 120 && !isFocusMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: -20, x: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20, x: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={() => {
            triggerHaptic('medium');
            if (onToggleFocusMode) {
              onToggleFocusMode(true);
            }
            if (displayChartData.length > 0) {
              setSelectedSector(displayChartData[0].categoryKey);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed top-[74px] sm:top-[84px] right-3 sm:right-6 z-[90] bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full p-2 xs:p-2.5 sm:p-3 shadow-2xl flex items-center gap-2 border border-white/20 active:scale-95 cursor-pointer group hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 ring-4 ring-indigo-500/10"
          title={language === 'en' ? 'Open performance chart' : 'कार्यसम्पादन चार्ट खोल्नुहोस्'}
        >
          {/* Pulsing indicator circle */}
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-[10px] sm:text-xs shadow-inner">
            <span className="relative z-10">{displayAverage}%</span>
            <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          </div>
          
          <div className="flex flex-col items-start pr-1 sm:pr-2 max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 ease-out whitespace-nowrap">
            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-indigo-100 leading-none">
              {(hoveredPerfMode || perfMode) === "strategic"
                ? language === "en"
                  ? "Strategic"
                  : "रणनीतिक"
                : (hoveredPerfMode || perfMode) === "weighted"
                  ? language === "en"
                    ? "Weighted"
                    : "भारित"
                  : language === "en"
                    ? "Indicator"
                    : "साधारण"}
            </span>
            <span className="text-[8px] sm:text-[9px] font-extrabold text-white uppercase tracking-wider leading-none mt-0.5">
              {language === "en" ? "Open Chart" : "चार्ट खोल्नुहोस्"}
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  </>
);
};
