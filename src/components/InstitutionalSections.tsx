import React, { useMemo } from 'react';
import { Indicator, SystemMetadata } from '../types';
import { HISTORICAL_DATA } from '../historicalData';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from "../utils/apiBase";
import {
  AlertTriangle,
  Clock,
  History,
  CheckCircle,
  Info,
  ShieldAlert,
  Database,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Brain,
  Sparkles,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  AlertOctagon
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatNepaliDate, toNepaliNumerals } from '../utils/date';

const AnimatedNumber: React.FC<{
  value: number;
  isNepali: boolean;
  suffix?: string;
  className?: string;
}> = ({ value, isNepali, suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = React.useState<number>(0);
  const prevValueRef = React.useRef<number>(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // ms
    const startValue = prevValueRef.current;
    const endValue = value;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      const easeProgress = progress * (2 - progress);
      const currentValue = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  const formatted = isNepali ? toNepaliNumerals(displayValue) : displayValue.toString();

  return <span className={className}>{formatted}{suffix}</span>;
};

interface AnomalyType {
  indicatorId: string;
  indicatorName: string;
  type: string;
  severity: string;
  currentValue: number;
  previousValue: number | null;
  explanationEn: string;
  explanationNp: string;
}

export const DataLog: React.FC<{
  indicators: Indicator[];
  metadata?: SystemMetadata | null;
  onViewActivityDetail?: () => void;
}> = ({ indicators, metadata, onViewActivityDetail }) => {
  const { language, translateOffice } = useLanguage();

  // Sort indicators log to show explicitly edited indicators first, then alphabetical/importance
  const sortedIndicatorsLog = useMemo(() => {
    return [...indicators].filter(Boolean).sort((a, b) => {
      if (a.updatedAt && !b.updatedAt) return -1;
      if (!a.updatedAt && b.updatedAt) return 1;
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });
  }, [indicators]);

  const formatIndicatorDate = (dateStr?: string) => {
    if (!dateStr) return formatNepaliDate(metadata?.lastUpdateDate);
    return formatNepaliDate(dateStr, language === 'en' ? 'en' : 'np');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 p-6 sm:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/40"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Data Log' : 'डाटा लग'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {language === 'en' ? 'Audit Feed' : 'अडिट इतिहास'}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/35 border border-emerald-200/50 dark:border-emerald-900/30 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {language === 'en' ? 'Live Connected' : 'लाइभ जडान'}
        </span>
      </div>

      {/* Global Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div
          onClick={onViewActivityDetail}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/85 hover:border-indigo-500/35 hover:shadow-sm active:scale-[0.98] transition-all"
          title={language === 'en' ? 'Click to view detailed sync log comparison' : 'विस्तृत सिङ्क्रोनाइज विवरण हेर्न यहाँ क्लिक गर्नुहोस्'}
        >
          <Calendar size={18} className="text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
              {language === 'en' ? 'Last Sheet Update' : 'अन्तिम सिट अपडेट'}
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {formatNepaliDate(metadata?.lastUpdateDate)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3.5">
          <Clock size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
              {language === 'en' ? 'Next Review Scheduled' : 'अर्को समीक्षा तालिका'}
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {metadata?.nextUpdateDate
                ? formatNepaliDate(metadata.nextUpdateDate)
                : language === 'en' ? 'Not scheduled' : 'तालिका तोकिएको छैन'}
            </span>
          </div>
        </div>
      </div>

      {/* Indicator-level Freshness Feed — line-aligned like activity log */}
      <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-850">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {language === 'en' ? 'Indicator-level Verification Logs' : 'सूचक-स्तर प्रमाणीकरण विवरण लग'}
          </span>
          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
            {sortedIndicatorsLog.length} {language === 'en' ? 'Metrics Active' : 'सूचकहरू सक्रिय'}
          </span>
        </div>

        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {sortedIndicatorsLog.map((ind) => {
              const progressPct = ind.annualTarget > 0 ? Math.round((ind.annualProgress / ind.annualTarget) * 100) : 0;
              const hasCustomUpdate = !!ind.updatedAt;

              return (
                <div
                  key={ind.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 w-10 shrink-0">
                    {progressPct}%
                  </span>

                  <span className="flex-1 min-w-0 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {language === 'en' ? (ind.nameEn || ind.name) : ind.name}
                  </span>

                  <span className="text-[9px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                    {formatIndicatorDate(ind.updatedAt)}
                    {hasCustomUpdate && (
                      <span className="ml-1 px-1 py-0.2 bg-indigo-50 dark:bg-indigo-950/50 text-[8px] text-indigo-600 dark:text-indigo-400 font-black rounded">
                        {language === 'en' ? 'Live' : 'लाइभ'}
                      </span>
                    )}
                  </span>

                  <span className="text-[10px] text-slate-600 dark:text-slate-300 whitespace-nowrap truncate max-w-[180px] shrink-0" title={ind.gmail || ind.updatedBy}>
                    {ind.gmail || ind.updatedBy || (language === 'en' ? 'Not provided' : 'प्रदान गरिएको छैन')}
                  </span>

                  {ind.office && (
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 whitespace-nowrap truncate max-w-[140px] shrink-0" title={translateOffice(ind.office)}>
                      {translateOffice(ind.office)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const DataAnomalyDetection: React.FC<{
  indicators: Indicator[];
  retryKey?: number;
  onViewActivityDetail?: () => void;
}> = ({ indicators, retryKey }) => {
  const { language } = useLanguage();
  const [anomalies, setAnomalies] = React.useState<AnomalyType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [hasScanned, setHasScanned] = React.useState(false);
  const [anomalyError, setAnomalyError] = React.useState<string | null>(null);

  const runAnomalyDetection = React.useCallback(() => {
    setIsAnalyzing(true);
    setAnomalyError(null);

    fetch(`${API_BASE}/api/ai/detect-anomalies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        indicators,
        historicalData: HISTORICAL_DATA
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
        if (data.anomalies) {
          setAnomalies(data.anomalies);
          setHasScanned(true);
        } else {
          throw new Error("No anomalies returned");
        }
      })
      .catch(err => {
        console.error("Anomaly detection failed:", err);
        if (err.message && err.message.includes("API key")) {
          setAnomalyError(err.message);
        } else {
          setAnomalyError(
            language === 'en'
              ? 'Failed to run anomaly scan. Please try again.'
              : 'विसङ्गति स्क्यान गर्न असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।'
          );
        }
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, [indicators, language]);

  React.useEffect(() => {
    runAnomalyDetection();
  }, [retryKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-150 dark:border-white/5 p-6 sm:p-8 shadow-xl shadow-slate-200/20 dark:shadow-black/40"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-500/20">
            <Brain size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
              {language === 'en' ? 'Data Anomaly Detection' : 'डेटा विसंगति पहिचान'}
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-violet-50 dark:bg-violet-950 text-[8px] text-violet-600 dark:text-violet-400 font-bold rounded-md uppercase tracking-wider">
                <Sparkles size={8} className="animate-pulse text-violet-500" />
                Gemini AI
              </span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {language === 'en' ? 'Real-time auditing of road data surges and unexpected drops' : 'सडक डेटामा आउने उतार-चढावहरूको वास्तविक समयमा एआई अडिट'}
            </p>
          </div>
        </div>

        <button
          onClick={runAnomalyDetection}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            isAnalyzing
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700'
          }`}
        >
          <RefreshCw size={13} className={isAnalyzing ? "animate-spin" : ""} />
          {isAnalyzing
            ? (language === 'en' ? 'Analyzing...' : 'स्क्यान गर्दै...')
            : (language === 'en' ? 'Scan Now' : 'स्क्यान गर्नुहोस्')}
        </button>
      </div>

      {/* State rendering */}
      {isAnalyzing ? (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            {language === 'en' ? 'Gemini is auditing indicators against historical milestones...' : 'जेमिनीले ऐतिहासिक प्रगतिसँग तुलना गर्दै अडिट गर्दैछ...'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse" />
            <div className="h-28 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse" />
          </div>
        </div>
      ) : anomalyError ? (
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
          <AlertOctagon className="text-rose-500 mt-0.5 shrink-0" size={16} />
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
              {language === 'en' ? 'Analysis Interrupted' : 'विश्लेषणमा अवरोध'}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 leading-relaxed">
              {anomalyError}
            </p>
            <button
              onClick={runAnomalyDetection}
              className="mt-2.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm transition-all"
            >
              {language === 'en' ? 'Retry Audit' : 'पुन: प्रयास गर्नुहोस्'}
            </button>
          </div>
        </div>
      ) : hasScanned && anomalies.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle size={26} />
          </div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1">
            {language === 'en' ? 'All Trends Verified Clear' : 'सबै सूचक प्रवृत्ति ठीक छन्'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
            {language === 'en'
              ? 'Gemini AI has audited current road development indicators against past reporting intervals and verified that cumulative progress is logically consistent, showing no abnormal drops or unphysical progress surges.'
              : 'जेमिनी एआईले अघिल्ला प्रगति विवरणहरूसँग तुलना गर्दा प्रगतिहरू तर्कसंगत र सही पाएको छ; कुनै पनि अस्वाभाविक गिरावट वा अवास्तविक वृद्धि फेला परेको छैन।'}
          </p>
        </div>
      ) : hasScanned && anomalies.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>{language === 'en' ? 'Flagged Anomalies' : 'फ्ल्याग गरिएका विसंगतिहरू'}</span>
            <span className="text-rose-500 font-black">
              {anomalies.length} {language === 'en' ? 'Outliers Detected' : 'विसंगति फेला पर्यो'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anomaly, idx) => {
              const isHigh = anomaly.severity.toLowerCase() === 'high';
              const isMed = anomaly.severity.toLowerCase() === 'medium';

              let borderClass: string;
              let bgClass: string;
              let badgeClass: string;

              if (isHigh) {
                borderClass = 'border-l-4 border-l-rose-500';
                bgClass = 'bg-rose-50/10 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-900/10';
                badgeClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/40 dark:border-rose-900/30';
              } else if (isMed) {
                borderClass = 'border-l-4 border-l-amber-500';
                bgClass = 'bg-amber-50/10 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-900/10';
                badgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30';
              } else {
                borderClass = 'border-l-4 border-l-violet-500';
                bgClass = 'bg-violet-50/10 dark:bg-violet-950/5 border border-violet-100/50 dark:border-violet-900/10';
                badgeClass = 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/40 dark:border-violet-900/30';
              }

              const isNp = language === 'ne' || language === 'np';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl flex flex-col justify-between gap-3 ${borderClass} ${bgClass} hover:shadow-md transition-all duration-300`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2.5 mb-2.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeClass} flex items-center gap-1`}>
                        {anomaly.type === 'drop' ? (
                          <>
                            <TrendingDown size={10} />
                            {isNp ? 'प्रगति गिरावट' : 'PROGRESS DROP'}
                          </>
                        ) : anomaly.type === 'spike' ? (
                          <>
                            <TrendingUp size={10} />
                            {isNp ? 'अस्वाभाविक वृद्धि' : 'PROGRESS SPIKE'}
                          </>
                        ) : anomaly.type === 'exceeds_target' ? (
                          <>
                            <Sparkles size={10} />
                            {isNp ? 'लक्ष्य भन्दा बढी' : 'EXCEEDS TARGET'}
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={10} />
                            {isNp ? 'डाटा असंगत' : 'INCONSISTENT'}
                          </>
                        )}
                      </span>

                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                        isHigh
                          ? 'bg-rose-500/15 text-rose-500'
                          : isMed
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-violet-500/15 text-violet-500'
                      }`}>
                        {isNp ? (isHigh ? 'उच्च' : isMed ? 'मध्यम' : 'न्यून') : anomaly.severity}
                      </span>
                    </div>

                    <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 leading-snug line-clamp-2">
                      {isNp ? anomaly.indicatorName : (indicators.find(i => i.id === anomaly.indicatorId)?.nameEn || anomaly.indicatorName)}
                    </h5>

                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      {isNp ? anomaly.explanationNp : anomaly.explanationEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[9px] text-slate-400 font-mono pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase mr-1">{isNp ? 'हालको मान:' : 'Current:'}</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        {isNp ? toNepaliNumerals(anomaly.currentValue) : anomaly.currentValue}
                      </span>
                    </div>
                    {anomaly.previousValue !== null && (
                      <div>
                        <span className="font-bold text-slate-400 dark:text-slate-500 uppercase mr-1">{isNp ? 'अघिल्लो मान:' : 'Prev:'}</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {isNp ? toNepaliNumerals(anomaly.previousValue) : anomaly.previousValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950/20 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mb-4">
            <Brain size={26} className="text-slate-300" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-medium">
            {language === 'en'
              ? 'Anomaly scanner is ready. Click "Scan Now" to verify road development data consistency using Gemini AI.'
              : 'विसंगति स्क्यानर तयार छ। जेमिनी एआई प्रयोग गरी सडक प्रगति विवरण अडिट गर्न "स्क्यान गर्नुहोस्" मा क्लिक गर्नुहोस्।'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export const DataIntegrityMonitor: React.FC<{
  indicators: Indicator[];
}> = ({ indicators }) => {
  const { language } = useLanguage();

  const healthData = useMemo(() => {
    const issues: { id: string, name: string, issue: string, type: 'stale' | 'missing_history' | 'no_date' | 'exceeds_target', date?: string }[] = [];
    const now = new Date();
    const staleThresholdDays = 30;

    indicators.forEach(ind => {
      if (ind.annualProgress > ind.annualTarget) {
        issues.push({
          id: ind.id,
          name: ind.nameEn,
          issue: language === 'en' ? `Annual progress (${ind.annualProgress}) exceeds annual target (${ind.annualTarget}). Manual audit required.` : `वार्षिक प्रगति (${ind.annualProgress}) वार्षिक लक्ष्य (${ind.annualTarget}) भन्दा बढी छ। म्यानुअल अडिट आवश्यक छ।`,
          type: 'exceeds_target'
        });
      }

      if (ind.updatedAt) {
        const lastUpdated = new Date(ind.updatedAt);
        const diffDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24);
        if (diffDays > staleThresholdDays) {
          issues.push({
            id: ind.id,
            name: ind.nameEn,
            issue: language === 'en' ? `Stale (${Math.floor(diffDays)} days ago)` : `पुरानो (${Math.floor(diffDays)} दिन अघि)`,
            type: 'stale',
            date: ind.updatedAt.split('T')[0]
          });
        }
      } else {
        issues.push({
          id: ind.id,
          name: ind.nameEn,
          issue: language === 'en' ? 'No verification date recorded' : 'कुनै प्रमाणीकरण मिति रेकर्ड गरिएको छैन',
          type: 'no_date'
        });
      }

      const foundInHistory = HISTORICAL_DATA.some(snapshot =>
        snapshot.indicators.some(hInd => hInd.id === ind.id)
      );
      if (!foundInHistory) {
        issues.push({
          id: ind.id,
          name: ind.nameEn,
          issue: language === 'en' ? 'Missing historical snapshots' : 'ऐतिहासिक स्न्यापसटहरू हराइरहेका छन्',
          type: 'missing_history'
        });
      }
    });

    return {
      issues,
      totalIssues: issues.length,
      staleCount: issues.filter(i => i.type === 'stale').length,
      missingHistoryCount: issues.filter(i => i.type === 'missing_history').length
    };
  }, [indicators, language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-white dark:bg-slate-900 rounded-[32px] border ${
        healthData.totalIssues > 0
          ? 'border-rose-100 dark:border-rose-500/20 shadow-xl shadow-rose-500/5'
          : 'border-emerald-100 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/5'
      } overflow-hidden`}
    >
      <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        healthData.totalIssues > 0
          ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10'
          : 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl shadow-lg ${
            healthData.totalIssues > 0
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-emerald-500 text-white shadow-emerald-500/20'
          }`}>
            {healthData.totalIssues > 0 ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Data Integrity Monitor' : 'डेटा अखण्डता मोनिटर'}
            </h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
              healthData.totalIssues > 0 ? 'text-rose-500' : 'text-emerald-500'
            }`}>
              {healthData.totalIssues > 0
                ? (language === 'en' ? `${healthData.totalIssues} Potential Data Issues Detected` : `${healthData.totalIssues} सम्भावित डेटा समस्याहरू फेला पर्यो`)
                : (language === 'en' ? 'All Systems Clear - No Integrity Issues' : 'सबै प्रणालीहरू ठीक छन् - कुनै समस्या फेला परेन')
              }
            </p>
          </div>
        </div>

        {healthData.totalIssues > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-500/20 text-[10px] font-bold text-slate-600 dark:text-slate-400">
              <Clock size={12} className="text-rose-500" />
              <span>{healthData.staleCount} {language === 'en' ? 'Stale' : 'पुरानो'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-500/20 text-[10px] font-bold text-slate-600 dark:text-slate-400">
              <History size={12} className="text-rose-500" />
              <span>{healthData.missingHistoryCount} {language === 'en' ? 'History' : 'इतिहास'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {healthData.totalIssues > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 px-2">{language === 'en' ? 'Indicator' : 'सूचक'}</th>
                  <th className="pb-3 px-2">{language === 'en' ? 'Issue Categorization' : 'समस्या वर्गीकरण'}</th>
                  <th className="pb-3 px-2">{language === 'en' ? 'Context' : 'सन्दर्भ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {healthData.issues.map((issue, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition-colors">
                        {issue.name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{issue.id}</div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        {issue.type === 'stale' ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 text-[9px] font-black uppercase tracking-tight">
                            <Clock size={10} />
                            {language === 'en' ? 'STALE DATA' : 'पुरानो डेटा'}
                          </span>
                        ) : issue.type === 'missing_history' ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 text-[9px] font-black uppercase tracking-tight">
                            <History size={10} />
                            {language === 'en' ? 'NO HISTORY' : 'इतिहास छैन'}
                          </span>
                        ) : issue.type === 'exceeds_target' ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200/50 text-[9px] font-black uppercase tracking-tight">
                            <AlertTriangle size={10} />
                            {language === 'en' ? 'EXCEEDS TARGET' : 'लक्ष्य भन्दा बढी'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-tight">
                            <AlertTriangle size={10} />
                            {language === 'en' ? 'NOT VERIFIED' : 'प्रमाणित छैन'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed font-sans">
                        {issue.issue}
                        {issue.date && <span className="block text-[9px] text-slate-400 mt-0.5 italic">{language === 'en' ? 'Last verified:' : 'अन्तिम प्रमाणित:'} {issue.date}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-800/40 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1">
              {language === 'en' ? 'No Issues Found' : 'कुनै समस्या भेटिएन'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {language === 'en'
                ? 'All active metrics have valid historical data and have been verified within the target 30-day window.'
                : 'सबै सक्रिय सूचकहरूसँग मान्य ऐतिहासिक डेटा छ र तिनीहरू लक्षित ३० दिने अवधिभित्र प्रमाणित भएका छन्।'}
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 flex items-start gap-3">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Info size={14} />
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            {language === 'en'
              ? 'Admin Review Required: Indicators listed above require immediate verification or source documentation updates to maintain system credibility. Indicators with missing history will result in blank trend analysis charts.'
              : 'प्रशासक समीक्षा आवश्यक: प्रणालीको विश्वसनीयता कायम राख्न माथि सूचीबद्ध सूचकहरूलाई तत्काल प्रमाणीकरण वा स्रोत कागजात अद्यावधिकहरू आवश्यक पर्दछ। इतिहास नभएका सूचकहरूको चार्टहरू खाली देखिनेछन्।'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
