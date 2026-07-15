import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, TrendingUp, HelpCircle, Sparkles, Award, Target, FileText, Info, Share2, ChevronRight, QrCode, Mail, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import { formatDisplayDate } from '../utils/date';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface IndicatorHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator | null;
  updatesHistory: any[];
  fiscalYear?: string;
}

export const IndicatorHistoryDrawer: React.FC<IndicatorHistoryDrawerProps> = ({
  isOpen,
  onClose,
  indicator,
  updatesHistory = [],
  fiscalYear,
}) => {
  const { language, t, translateUnit, translatePeriod } = useLanguage();
  const [showQR, setShowQR] = useState(false);

    const historyLogs = useMemo(() => {
    if (!indicator) return [];

    // Extract records of this specific indicator from general snapshots
    const extracted = updatesHistory
      .map(historyItem => {
        const indSnap = historyItem.indicators?.find((i: any) => i.id === indicator.id || i.name === indicator.name);
        if (!indSnap) return null;

        return {
          id: historyItem.id,
          date: historyItem.lastUpdateDate || historyItem.id,
          createdAt: historyItem.createdAt,
          annualProgress: indSnap.annualProgress,
          annualTarget: indSnap.annualTarget,
          totalProgress: indSnap.totalProgress,
          totalTarget: indSnap.totalTarget,
          updatedAt: indSnap.updatedAt || historyItem.createdAt || '',
          updatedBy: indSnap.gmail || indSnap.updatedBy || historyItem.metadata?.updatedBy || (language === 'en' ? 'Not provided' : 'प्रदान गरिएको छैन')
        };
      })
      .filter(Boolean) as any[];

    // Ensure we always have at least the current state in our logs if it's newer or not yet captured
    const hasCurrentInHistory = extracted.some(
      log => log.annualProgress === indicator.annualProgress && 
             new Date(log.updatedAt).toLocaleDateString() === new Date(indicator.updatedAt || '').toLocaleDateString()
    );

    if (!hasCurrentInHistory && indicator.updatedAt) {
      extracted.unshift({
        id: 'current-live',
        date: formatDisplayDate(indicator.updatedAt, language),
        createdAt: indicator.updatedAt,
        annualProgress: indicator.annualProgress,
        annualTarget: indicator.annualTarget,
        totalProgress: indicator.totalProgress,
        totalTarget: indicator.totalTarget,
        updatedAt: indicator.updatedAt,
        updatedBy: indicator.updatedBy || 'SystemSync'
      });
    }

    // Sort chronologically (most recent first for timeline, oldest first for chart)
    return extracted.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [indicator, updatesHistory]);

  // Data formatted for Recharts (oldest first for left-to-right trend line)
  const chartData = useMemo(() => {
    return [...historyLogs]
      .reverse()
      .map(log => ({
        date: formatDisplayDate(log.updatedAt || log.createdAt, language),
        progress: log.annualProgress,
        percent: log.annualTarget > 0 ? Math.min(100, Math.round((log.annualProgress / log.annualTarget) * 100)) : 0,
      }));
  }, [historyLogs, language]);

  if (!indicator) return null;

  const primaryName = language === 'en' ? (indicator.nameEn || indicator.name) : indicator.name;
  const secondaryName = language === 'en' ? indicator.name : (indicator.nameEn || indicator.name);

  const currentPercent = indicator.annualTarget > 0 
    ? Math.round((indicator.annualProgress / indicator.annualTarget) * 100)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-[1050] pointer-events-auto"
          />

          {/* Subtle Zoom-In Panel (Centered for focus) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[90vh] w-full max-w-2xl bg-white dark:bg-slate-900 shadow-3xl z-[1060] flex flex-col pointer-events-auto border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onClose();
                  }}
                  className="p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl relative">
                  <TrendingUp size={18} className="sm:w-5 sm:h-5 animate-pulse" />
                  {/* Mini Sparkline in Header */}
                  {chartData.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center p-0.5 shadow-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <Area type="monotone" dataKey="progress" stroke="#6366f1" fill="#c7d2fe" strokeWidth={1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans uppercase tracking-wider">
                    {language === 'en' ? 'Indicator History Log' : 'सूचक इतिहास विवरण'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {language === 'en' ? 'Audit Timeline & Milestones' : 'प्रगति अद्यावधिक समयरेखा'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowQR(!showQR);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${showQR ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  title={language === 'en' ? 'Toggle QR code' : 'QR कोड हेर्नुहोस्'}
                >
                  <QrCode size={18} />
                </button>
                 <button
                  onClick={() => {
                    triggerHaptic('medium');
                    const emailSubject = encodeURIComponent(`${t('progressReport')}: ${primaryName}`);
                    const emailBody = encodeURIComponent(`${primaryName}\n\n${t('annualTarget')}: ${indicator.annualTarget} ${translateUnit(indicator.unit)}\n${t('annualProgressTillNow')}: ${indicator.annualProgress} ${translateUnit(indicator.unit)} (${currentPercent}%)\n\n${window.location.href}`);
                    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                  }}
                  className="p-2 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-all cursor-pointer"
                  title={language === 'en' ? 'Share via email' : 'इमेलमार्फत सेयर गर्नुहोस्'}
                >
                  <Mail size={18} />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    const shareMessage = encodeURIComponent(`📈 ${primaryName}\n🎯 ${t('progress')}: ${indicator.annualProgress} ${translateUnit(indicator.unit)} (${currentPercent}%)\n🔗 ${window.location.href}`);
                    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
                  }}
                  className="p-2 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-all cursor-pointer"
                  title={language === 'en' ? 'Share via WhatsApp' : 'व्हाट्सएपमार्फत सेयर गर्नुहोस्'}
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onClose();
                  }}
                  className="hidden sm:block p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 custom-scrollbar text-left">
              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-4"
                >
                  <QRCodeSVG value={window.location.href} size={200} />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">
                    {language === 'en' ? 'Scan to view indicator' : 'सूचक हेर्न स्क्यान गर्नुहोस्'}
                  </p>
                </motion.div>
              )}
              {/* Indicator Brief Overview */}
              <div className="space-y-2 sm:space-y-3 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 sm:p-5 rounded-3xl border border-indigo-100/10">
                <div className="flex flex-wrap gap-1.5">
                  {indicator.sdg && indicator.sdg !== '-' && (
                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200/20">
                      SDG {indicator.sdg}
                    </span>
                  )}
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/20">
                    {translatePeriod(indicator.period)}
                  </span>
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/20">
                    {currentPercent}% {language === 'en' ? 'Complete' : 'सम्पन्न'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                    {primaryName}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-450 italic">
                    {secondaryName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100/50 dark:border-slate-800/50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">{t('annualTarget')}</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                      {indicator.annualTarget} <span className="text-[10px] text-slate-400 font-normal">({translateUnit(indicator.unit)})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">{t('annualProgressTillNow')}</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                      {indicator.annualProgress} <span className="text-[10px] text-slate-400 font-normal">({translateUnit(indicator.unit)})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Over Time Trend Chart */}
              {chartData.length > 1 && (
                <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-indigo-500" />
                    <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                      {language === 'en' ? 'Progress Trajectory' : 'प्रगति वृद्धि प्रवृत्ति'}
                    </h5>
                  </div>
                  <div className="h-[130px] sm:h-40 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="historyColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.1} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9, fill: '#94a3b8' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[0, 'auto']} 
                          tick={{ fontSize: 9, fill: '#94a3b8' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '11px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="progress" 
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#historyColor)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Audit Timeline List */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-500" />
                  <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                    {language === 'en' ? 'Progress Milestones' : 'प्रगति माइलस्टोनहरू'}
                  </h5>
                </div>

                {historyLogs.length === 0 ? (
                  <div className="text-center py-10 px-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-400">
                      <Calendar size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {language === 'en' ? 'No milestones recorded yet' : 'अहिलेसम्म कुनै माइलस्टोन रेकर्ड गरिएको छैन'}
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                        {language === 'en' ? 'Progress snapshots will appear here once the indicator is updated.' : 'सूचक अद्यावधिक भएपछि प्रगति विवरणहरू यहाँ देखिनेछन्।'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                  {historyLogs.map((log, index) => {
                    const logPercent = log.annualTarget > 0 
                      ? Math.min(100, Math.round((log.annualProgress / log.annualTarget) * 100))
                      : 0;

                    return (
                      <div 
                        key={log.id} 
                        className={`group flex items-center justify-between p-3 sm:p-4 transition-all rounded-2xl ${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-slate-900/50' 
                            : 'bg-slate-50 dark:bg-slate-950/30'
                        } hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {formatDisplayDate(log.updatedAt || log.createdAt, language)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                             {log.annualProgress} / {log.annualTarget} {translateUnit(indicator.unit)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                             {t('updatedBy')}: {log.updatedBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${logPercent}%` }}
                              transition={{ type: "spring", stiffness: 60, damping: 12, delay: index * 0.03 }}
                              className="h-full bg-indigo-500 rounded-full" 
                            />
                          </div>
                          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 w-8 text-right">
                            {logPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>

            {/* Bottom Panel Branding */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles size={11} className="text-indigo-500" />
                 © DOR | 2082/83 B.S
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
