import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertCircle, Check, Clock, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DashboardAlertsProps {
  indicators: Indicator[];
  trackedIds: string[];
  onToggleTrack: (id: string) => void;
  onNavigateToCards?: () => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  indicators,
  trackedIds,
  onToggleTrack,
  onNavigateToCards
}) => {
  const { language, t } = useLanguage();

  // Use state-based tracked ids or default first 3 if none actively tracked
  const activeTrackedIds = useMemo(() => {
    if (trackedIds.length > 0) return trackedIds;
    return indicators.slice(0, 3).map(i => i.id);
  }, [trackedIds, indicators]);

  const alertsData = useMemo(() => {
    return activeTrackedIds.map(id => {
      const ind = (indicators || []).find(i => i && i.id === id);
      if (!ind) return null;

      const progressPercent = ind.annualTarget > 0 
        ? Math.round((ind.annualProgress / ind.annualTarget) * 100) 
        : 0;

      const isCritical = progressPercent < 50;
      const isAtRisk = progressPercent >= 50 && progressPercent < 80;
      
      // Calculate days since last update
      const lastUpdateDate = ind.updatedAt ? new Date(ind.updatedAt) : null;
      let daysSinceUpdate = null;
      let isStale = false;
      if (lastUpdateDate) {
        const diffMs = new Date().getTime() - lastUpdateDate.getTime();
        daysSinceUpdate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        isStale = daysSinceUpdate > 30;
      }

      return {
        id: ind.id,
        indicator: ind,
        name: language === 'en' ? (ind.nameEn || ind.name) : ind.name,
        progressPercent,
        isCritical,
        isAtRisk,
        daysSinceUpdate,
        isStale,
        updatedAt: ind.updatedAt,
        updatedBy: ind.updatedBy,
        category: ind.category
      };
    }).filter(Boolean) as any[];
  }, [activeTrackedIds, indicators, language]);

  const stats = useMemo(() => {
    const total = alertsData.length;
    const critical = alertsData.filter(a => a.isCritical).length;
    const atRisk = alertsData.filter(a => a.isAtRisk).length;
    const stable = total - critical - atRisk;
    const stale = alertsData.filter(a => a.isStale).length;

    return { total, critical, atRisk, stable, stale };
  }, [alertsData]);

  const handleResetDefaults = () => {
    // If we want to restore default tracking, we track the first 3
    indicators.slice(0, 3).forEach(ind => {
      if (!trackedIds.includes(ind.id)) {
        onToggleTrack(ind.id);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden" id="dashboard-alerts-panel">
      {/* Panel Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-950/40 dark:via-slate-900 dark:to-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Bell className="w-4 h-4 animate-swing" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'Alerts Control Center' : 'अलर्ट नियन्त्रण केन्द्र'}
              </h3>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-0.5">
                {language === 'en' 
                  ? 'Automated tracking on critical thresholds & update times' 
                  : 'थ्रेसहोल्ड र अपडेटहरूको स्वचालित ट्र्याकिङ'}
              </p>
            </div>
          </div>
          {stats.critical > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9.5px] font-black uppercase tracking-wider animate-pulse">
              {stats.critical} Critical
            </span>
          )}
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="py-1.5 px-1 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/20">
            <span className="block text-[11px] font-black text-rose-600 dark:text-rose-450">{stats.critical}</span>
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              {language === 'en' ? 'Critical' : 'गम्भीर'}
            </span>
          </div>
          <div className="py-1.5 px-1 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/20">
            <span className="block text-[11px] font-black text-amber-600 dark:text-amber-450">{stats.atRisk}</span>
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              {language === 'en' ? 'At Risk' : 'जोखिम'}
            </span>
          </div>
          <div className="py-1.5 px-1 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/20">
            <span className="block text-[11px] font-black text-emerald-600 dark:text-emerald-450">{stats.stable}</span>
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              {language === 'en' ? 'Healthy' : 'स्थिर'}
            </span>
          </div>
        </div>
      </div>

      {/* alerts List */}
      <div className="p-5 space-y-4 max-h-[36rem] overflow-y-auto">
        {alertsData.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-550 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'No Tracked Indicators' : 'कुनै सूचकहरू ट्र्याक गरिएका छैनन्'}
            </p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs mx-auto">
              {language === 'en' 
                ? 'Select and track customized indicators to monitor critical targets and update frequencies.' 
                : 'क्रिटिकल लक्ष्य र अपडेट फ्रिक्वेन्सीहरू अनुगमन गर्न सूचकहरू चयन गर्नुहोस्।'}
            </p>
            <button
              onClick={handleResetDefaults}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              {language === 'en' ? 'Track Default Indicators' : 'पूर्वनिर्धारित सूचकहरू ट्र्याक गर्नुहोस्'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {alertsData.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border transition-all ${
                    alert.isCritical 
                      ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-100/60 dark:border-rose-900/40 ring-1 ring-rose-500/10' 
                      : alert.isStale
                      ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/40 ring-1 ring-amber-500/10'
                      : 'bg-slate-50/40 dark:bg-slate-800/10 border-slate-150 dark:border-slate-800/30'
                  }`}
                >
                  {/* Indicator info */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider font-black text-slate-400 dark:text-slate-500 block">
                        {alert.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2 leading-snug">
                        {alert.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => onToggleTrack(alert.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={language === 'en' ? 'Stop tracking' : 'अनुगमन बन्द गर्नुहोस्'}
                    >
                      <X size={11} />
                    </button>
                  </div>

                  {/* Progress visualization */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1 text-[10px]">
                      <span className="text-slate-450 dark:text-slate-500">
                        {language === 'en' ? 'Annual Progress' : 'वार्षिक प्रगति'}
                      </span>
                      <span className={`font-black ${
                        alert.isCritical ? 'text-rose-600 dark:text-rose-400' : alert.isAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {alert.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, alert.progressPercent)}%` }}
                        transition={{ type: "spring", stiffness: 60, damping: 12 }}
                        className={`h-full rounded-full ${
                          alert.isCritical ? 'bg-rose-500' : alert.isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Status threshold badge */}
                  <div className="mt-3 space-y-2 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100/50 dark:border-slate-800/50 pt-2.5">
                    {alert.isCritical ? (
                      <div className="font-semibold text-rose-700 dark:text-rose-350 flex items-center gap-1.5">
                        <AlertCircle size={12} className="shrink-0 text-rose-500" />
                        <span>
                          {language === 'en' 
                            ? 'CRITICAL THRESHOLD: Progress is below 50% target.' 
                            : 'गम्भीर अवस्था: प्रगति ५०% भन्दा तल खसेको छ।'}
                        </span>
                      </div>
                    ) : alert.isAtRisk ? (
                      <div className="font-semibold text-amber-700 dark:text-amber-350 flex items-center gap-1.5">
                        <AlertCircle size={12} className="shrink-0 text-amber-500" />
                        <span>
                          {language === 'en'
                            ? 'CAUTION: Progress is under 80% on-track target.'
                            : 'सावधानी: प्रगति ८०% को लक्षित विन्दु भन्दा कम छ।'}
                        </span>
                      </div>
                    ) : (
                      <div className="font-semibold text-emerald-700 dark:text-emerald-350 flex items-center gap-1.5">
                        <Check size={12} className="shrink-0 text-emerald-500" />
                        <span>
                          {language === 'en'
                            ? 'ON TRACK: Target completion metrics are fully healthy.'
                            : 'सञ्चालनमा: प्रगति मापदण्ड पूर्ण स्वस्थ र सक्रिय छ।'}
                        </span>
                      </div>
                    )}

                    {/* Relative Last Update Info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 p-1.5 rounded-lg border border-slate-100/30 dark:border-slate-800/20">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {alert.daysSinceUpdate !== null ? (
                          language === 'en'
                            ? `Updated ${alert.daysSinceUpdate === 0 ? 'today' : alert.daysSinceUpdate === 1 ? 'yesterday' : `${alert.daysSinceUpdate} days ago`}`
                            : `अपडेट गरिएको: ${alert.daysSinceUpdate === 0 ? 'आज' : alert.daysSinceUpdate === 1 ? 'हिजो' : `${alert.daysSinceUpdate} दिन पहिले`}`
                        ) : (
                          language === 'en' ? 'No updates reported' : 'कुनै अपडेट छैन'
                        )}
                      </span>
                      {alert.updatedBy && (
                        <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded shadow-sm">
                          by {alert.updatedBy.split('@')[0]}
                        </span>
                      )}
                    </div>

                    {alert.isStale && (
                      <div className="text-amber-600 dark:text-amber-400 font-bold text-[9px] flex items-center gap-1 bg-amber-500/5 dark:bg-amber-950/10 p-1.5 rounded border border-amber-500/10">
                        <span>⚠️</span>
                        <span>
                          {language === 'en' 
                            ? 'STALE WARNING: No progress reported for over 30 days.' 
                            : 'पुरानो चेतावनी: सूचकमा विगत ३० दिनदेखि कुनै अपडेट छैन।'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Card toggle instructions */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onNavigateToCards}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors py-1 cursor-pointer"
        >
          <span>
            {language === 'en' ? 'Customize Followed Indicators' : 'सूचकहरूको अनुगमन अनुकूलन गर्नुहोस्'}
          </span>
          <ArrowRight size={12} className="animate-pulse" />
        </button>
      </div>
    </div>
  );
};
