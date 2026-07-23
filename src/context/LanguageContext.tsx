import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '../constants/branding';
import { APP_TITLES } from '../constants/appTitles';
import { translateOffice as dataTranslateOffice } from '../data';

export type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateUnit: (unit: string) => string;
  translatePeriod: (period: string) => string;
  translateCategory: (category: string) => string;
  translateOffice: (name: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    govOfNepal: APP_CONFIG.branding.line1.en,
    ministryOfPhysical: APP_CONFIG.branding.line2.en,
    deptOfRoads: APP_CONFIG.branding.line3.en,
    dorProgress: APP_TITLES.appName.en,
    splashTitle: APP_TITLES.appName.en,
    splashSubtext: APP_TITLES.subHeader.en,
    systemTitle: 'Performance Tracking System',
    kpisSubtitle: 'Key Performance Indicators (KPIs)',
    idpts: 'IDPTS',
    trendView: 'Trends',
    heatmapView: 'Performance Heatmap',
    lastUpdate: 'Last Update',
    nextUpdate: 'Next Update',
    overallProgress: 'Overall Progress',
    totalIndicators: 'Total Indicators',
    searchIndicator: 'Search indicators...',
    filter: 'Filter',
    all: 'All',
    baselineUnit: 'Unit & Baseline',
    annualTarget: 'Annual Target',
    totalTarget: 'Total Target',
    totalProgress: 'Total Progress',
    annualProgressTillNow: 'Annual Progress Till Now',
    weight: 'Weight',
    period: 'Period',
    by: 'By',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    complete: 'Complete',
    inProgress: 'In Progress',
    pending: 'Pending',
    onTrack: 'On Track',
    excellent: 'Excellent',
    progressing: 'Progressing',
    atRisk: 'At Risk',
    delayed: 'Delayed',
    print: 'Print',
    pdf: 'PDF',
    clip: 'Clip',
    qr: 'QR',
    ai: 'AI',
    help: 'Help',
    instantAccess: 'Instant Access',
    shareTo: 'Share To',
    scanForLive: 'Scan for Live Data',
    documentControl: 'Document Control',
    detailedIndicators: 'Detailed Indicators',
    indicatorName: 'Indicator Name',
    sn: 'SN',
    syncSheets: 'Sync Sheets',
    logOut: 'Log Out',
    adminPanel: 'Admin Panel',
    activeUsers: 'Active Users',
    userActivityLogs: 'User Activity Logs',
    exportPdf: 'Export PDF',
    printReport: 'Print Report',
    overallWeightProgress: 'Overall Weight Progress',
    annualPlanTargetRate: 'Annual Plan Target Rate',
    totalBudgetBillion: 'Total Budget, Billion',
    unitBaseline: 'Unit & Baseline',
    annualTargetLabel: 'Annual Target',
    average: 'Average',
    target: 'Target',
    progress: 'Progress',
    unit: 'Unit',
    contribution: 'Contribution',
    weighted: 'Weighted',
    adminLogin: 'Admin Login',
    backToDashboard: 'Back to Dashboard',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    email: 'Email',
    password: 'Password',
    close: 'Close',
    addNewIndicator: 'Add New Indicator',
    editIndicator: 'Edit Indicator Progress',
    category: 'Category',
    indicatorKey: 'Indicator Key',
    annualTargetShort: 'Annual Target',
    annualProgressShort: 'Annual Progress',
    totalTargetShort: 'Total Target',
    totalProgressShort: 'Total Progress',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    loading: 'Loading...',
    allRightsReserved: 'All Rights Reserved.',
    secureActionPortal: 'ACTION PORTAL',
    overallPerformance: 'Overall Performance',
    achieved: 'Achieved',
    weightedTargetsAchievementAvg: 'Weighted targets achievement average',
    potholeRepair: 'Pothole Repair',
    bridgeConstruction: 'Bridge Construction',
    roadBlacktopping: 'Road Blacktopping',
    potholeRepairTitle: 'Pothole Repair Progress',
    bridgeConstructionTitle: 'Bridge Construction Status',
    roadBlacktoppingTitle: 'Road Blacktopping Achievement',
    roadTypes: 'Road Types & Maintenance',
    languageToggle: 'Language',
    dashboard: 'Dashboard',
    cardView: 'Card view',
    chartView: 'Chart view',
    tableView: 'Table view',
    // Categories
    'Infrastructure Creation': 'Infrastructure Creation',
    'Maintenance': 'Road Maintenance',
    'Employment Creation': 'Employment Creation',
    'Budget Utilization': 'Budget Utilization',
    'Governance': 'Governance & Auditing',
    sortBy: 'Sort By',
    sortDefault: 'Default Order',
    sortLowProgress: 'Low Progress First',
    sortHighProgress: 'High Progress First',
    scanToOpen: 'Scan to Open',
    reportBuilder: 'Consolidated Report Builder',
    selectIndicators: 'Select Indicators to Include',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    selectFiltered: 'Select Current Filtered',
    selectCompleted: 'Select Completed',
    generateReport: 'Generate Consolidated Report',
    searchPlaceholder: 'Search indicators inside builder...',
    includedItems: 'included',
    reportOptions: 'Report Options',
    showSummaryMetrics: 'Include Summary Metrics',
    customReportTitle: 'Custom Report Title (Optional)',
    customReportTitlePlaceholder: 'e.g., Q3 Progress Review',
    rotateHorizontal: 'Rotate Horizontal',
    rotateVertical: 'Rotate Vertical',
    categoryPerformance: 'Category Performance',
    averageProgressByCategory: 'Average Progress by Category',
    kpiSummary: 'KPI summary',
    portfolioHealth: 'Portfolio health',
    targetProgress: 'Target Progress',
    statusGuide: 'Status Guide',
    excellentCriteria: 'Excellent: Progress is 90% or higher.',
    onTrackCriteria: 'On Track: Progress is 75% to 89%.',
    progressingCriteria: 'Progressing: Progress is 50% to 74%.',
    atRiskCriteria: 'At Risk: Progress is 25% to 49%.',
    delayedCriteria: 'Delayed: Progress is below 25%.',
    performanceDetail: 'Performance Detail',
    baseline: 'Baseline',
    completion: 'Completion',
    vsBaseline: 'Vs Baseline',
    annualProgress: 'Annual Progress',
  },
  ne: {
    govOfNepal: APP_CONFIG.branding.line1.ne,
    ministryOfPhysical: APP_CONFIG.branding.line2.ne,
    deptOfRoads: APP_CONFIG.branding.line3.ne,
    dorProgress: APP_TITLES.appName.ne,
    splashTitle: APP_TITLES.appName.ne,
    splashSubtext: APP_TITLES.subHeader.ne,
    systemTitle: 'कार्यसम्पादन अनुगमन प्रणाली',
    kpisSubtitle: 'मुख्य कार्यसम्पादन सूचकहरू (KPIs)',
    idpts: 'IDPTS',
    trendView: 'प्रवृत्ति',
    heatmapView: 'कार्यसम्पादन हिटम्याप',
    lastUpdate: 'अन्तिम अपडेट',
    nextUpdate: 'अर्को अपडेट',
    overallProgress: 'कुल प्रगति',
    totalIndicators: 'कुल सूचक',
    searchIndicator: 'सूचक खोज्नुहोस्...',
    filter: 'फिल्टर',
    all: 'सबै',
    baselineUnit: 'यूनिट/वेशलाइन',
    annualTarget: 'वार्षिक लक्ष्य',
    totalTarget: 'कुल लक्ष्य',
    totalProgress: 'कुल प्रगति',
    annualProgressTillNow: 'वार्षिक प्रगति',
    weight: 'भार',
    period: 'अवधि',
    by: 'द्वारा',
    monthly: 'मासिक',
    quarterly: 'त्रैमासिक',
    complete: 'सम्पन्न',
    inProgress: 'प्रगतिमा',
    pending: 'बाँकी',
    onTrack: 'सञ्चालनमा',
    excellent: 'उत्कृष्ट',
    progressing: 'प्रगतिमा',
    atRisk: 'जोखिममा',
    delayed: 'ढिलो',
    print: 'प्रिन्ट',
    pdf: 'पीडिएफ',
    clip: 'क्लिप',
    qr: 'क्यूआर',
    ai: 'एआई',
    help: 'मद्दत',
    instantAccess: 'तत्काल पहुँच',
    shareTo: 'सेयर',
    scanForLive: 'प्रत्यक्ष डेटा',
    documentControl: 'दस्तावेज',
    detailedIndicators: 'विस्तृत सूचक',
    indicatorName: 'सूचकको नाम',
    sn: 'क्र.सं.',
    syncSheets: 'सिट्स सिङ्क',
    logOut: 'बाहिरिनुहोस्',
    adminPanel: 'प्रशासक',
    activeUsers: 'सक्रिय प्रयोगकर्ता',
    userActivityLogs: 'गतिविधि लग',
    exportPdf: 'पीडिएफ डाउनलोड',
    printReport: 'रिपोर्ट प्रिन्ट',
    overallWeightProgress: 'कुल भार प्रगति',
    annualPlanTargetRate: 'वार्षिक लक्ष्य दर',
    totalBudgetBillion: 'कुल बजेट, अर्ब',
    unitBaseline: 'यूनिट/वेशलाइन',
    annualTargetLabel: 'वार्षिक लक्ष्य',
    average: 'औसत',
    target: 'लक्ष्य',
    progress: 'प्रगति',
    unit: 'इकाई',
    contribution: 'योगदान',
    weighted: 'भारित',
    adminLogin: 'प्रशासक लगइन',
    backToDashboard: 'ड्यासबोर्ड',
    signingIn: 'लगइन...',
    signIn: 'लगइन',
    email: 'इमेल',
    password: 'पासवर्ड',
    close: 'बन्द',
    addNewIndicator: 'नयाँ सूचक',
    editIndicator: 'सूचक सम्पादन',
    category: 'श्रेणी',
    indicatorKey: 'सूचक कुञ्जी',
    annualTargetShort: 'वार्षिक लक्ष्य',
    annualProgressShort: 'वार्षिक प्रगति',
    totalTargetShort: 'कुल लक्ष्य',
    totalProgressShort: 'कुल प्रगति',
    cancel: 'रद्द',
    saveChanges: 'सेभ',
    saving: 'बचत...',
    loading: 'लोड...',
    allRightsReserved: 'सर्वाधिकार सुरक्षित।',
    secureActionPortal: 'एक्सन पोर्टल',
    overallPerformance: 'समग्र कार्यसम्पादन',
    achieved: 'हासिल',
    weightedTargetsAchievementAvg: 'भारित लक्ष्य प्राप्ति',
    potholeRepair: 'खाल्डो मर्मत',
    bridgeConstruction: 'पुल निर्माण',
    roadBlacktopping: 'सडक कालोपत्रे',
    potholeRepairTitle: 'खाल्डो मर्मत',
    bridgeConstructionTitle: 'पुल निर्माण',
    roadBlacktoppingTitle: 'सडक कालोपत्रे',
    roadTypes: 'सडक प्रकार',
    languageToggle: 'भाषा',
    dashboard: 'ड्यासबोर्ड',
    cardView: 'कार्ड',
    chartView: 'चार्ट',
    tableView: 'तालिका',
    // Categories
    'Infrastructure Creation': 'भौतिक पूर्वाधार निर्माण',
    'Maintenance': 'सडक मर्मतसम्भार',
    'Employment Creation': 'रोजगारी सिर्जना',
    'Budget Utilization': 'बजेट उपयोगिता',
    'Governance': 'सुशासन र संस्थागत सबलीकरण',
    sortBy: 'क्रमबद्ध',
    sortDefault: 'पूर्वनिर्धारित',
    sortLowProgress: 'कम प्रगति',
    sortHighProgress: 'उच्च प्रगति',
    scanToOpen: 'स्क्यान गर्नुहोस्',
    reportBuilder: 'प्रतिवेदन',
    selectIndicators: 'सूचक छान्नुहोस्',
    selectAll: 'सबै छान्नुहोस्',
    clearAll: 'हटाउनुहोस्',
    selectFiltered: 'फिल्टर छान्नुहोस्',
    selectCompleted: 'सम्पन्न छान्नुहोस्',
    generateReport: 'प्रतिवेदन बनाउनुहोस्',
    searchPlaceholder: 'सूचक खोज्नुहोस्...',
    includedItems: 'समावेश',
    reportOptions: 'विकल्पहरू',
    showSummaryMetrics: 'तथ्याङ्क समावेश',
    customReportTitle: 'प्रतिवेदन शीर्षक',
    customReportTitlePlaceholder: 'उदाहरण: प्रगति समीक्षा',
    rotateHorizontal: 'तेर्सो घुमाउनुहोस्',
    rotateVertical: 'ठाडो घुमाउनुहोस्',
    categoryPerformance: 'श्रेणीगत कार्यसम्पादन',
    averageProgressByCategory: 'श्रेणी अनुसार औसत प्रगति',
    kpiSummary: 'कार्यसम्पादन सारांश',
    portfolioHealth: 'पोर्टफोलियोको अवस्था',
    targetProgress: 'लक्ष्य प्रगति',
    statusGuide: 'स्थिति निर्देशिका',
    excellentCriteria: 'उत्कृष्ट: प्रगति ९०% वा सोभन्दा बढी।',
    onTrackCriteria: 'सञ्चालनमा: प्रगति ७५% देखि ८९% सम्म।',
    progressingCriteria: 'प्रगतिमा: प्रगति ५०% देखि ७४% सम्म।',
    atRiskCriteria: 'जोखिममा: प्रगति २५% देखि ४९% सम्म।',
    delayedCriteria: 'ढिलो: प्रगति २५% भन्दा कम।',
    performanceDetail: 'कार्यसम्पादन विवरण',
    baseline: 'वेशलाइन',
    completion: 'सम्पन्नता',
    vsBaseline: 'वेशलाइन तुलना',
    annualProgress: 'वार्षिक प्रगति',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('language');
        return (saved === 'en' || saved === 'ne') ? saved : 'en'; // Default to English
      } catch {
        // Suppress redundant log
        return 'en';
      }
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch {
      // Suppress redundant log
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const translateUnit = (unit: string): string => {
    if (language === 'ne') {
      const enToNe: Record<string, string> = {
        'Km': 'कि.मी.',
        'Units': 'वटा',
        'Qty': 'संख्या',
        'Meters': 'मिटर',
        'Man-days (K)': 'कार्यदिन (हजारमा)',
        'Billion (NPR)': 'अर्ब',
        '%': 'प्रतिशत',
        'Billion NPR': 'अर्ब'
      };
      return enToNe[unit] || unit;
    } else {
      const neToEn: Record<string, string> = {
        'कि.मी.': 'Km',
        'कि. मि.': 'Km',
        'कि.मि.': 'Km',
        'वटा': 'Units',
        'संख्या': 'Qty',
        'मिटर': 'Meters',
        'कार्यदिन (हजारमा)': 'Man-days (K)',
        'अर्ब': 'Billion NPR',
        'प्रतिशत': '%',
      };
      return neToEn[unit] || unit;
    }
  };

  const translatePeriod = (period: string): string => {
    if (language === 'en') {
      if (period === 'मासिक' || period === 'Monthly') return 'Monthly';
      if (period === 'त्रैमासिक' || period === 'Quarterly') return 'Quarterly';
      return period;
    } else {
      if (period === 'Monthly' || period === 'मासिक') return 'मासिक';
      if (period === 'Quarterly' || period === 'त्रैमासिक') return 'त्रैमासिक';
      return period;
    }
  };

  const translateCategory = (category: string): string => {
    return t(category);
  };

  const translateOffice = (name: string): string => {
    return dataTranslateOffice(name, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateUnit, translatePeriod, translateCategory, translateOffice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
