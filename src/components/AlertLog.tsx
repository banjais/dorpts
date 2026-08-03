import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, Trash2, Clock, Sliders, Volume2 } from 'lucide-react';
import { speak } from '../utils/speech';

export interface AlertLogEntry {
  id: string;
  indicatorId: string;
  indicatorName: string;
  indicatorNameEn?: string;
  category: string;
  threshold: number;
  progress: number;
  timestamp: string;
}

interface AlertLogProps {
  logs: AlertLogEntry[];
  onClearLogs: () => void;
}

export const AlertLog: React.FC<AlertLogProps> = ({ logs, onClearLogs }) => {
  const { language } = useLanguage();

  const toNepaliNumerals = (numStr: string | number): string => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      const formatted = date.toLocaleTimeString(language === 'np' ? 'ne-NP' : 'en-US', options);
      return language === 'np' ? toNepaliNumerals(formatted) : formatted;
    } catch (e) {
      return isoStr;
    }
  };

  const speakAlertSummary = () => {
    if (logs.length === 0) {
      speak(language === 'en' ? "No threshold breaches reported. All indicators are performing normally." : "कुनै थ्रेसहोल्ड उल्लंघन छैन। सबै सूचकहरू सामान्य रूपमा प्रदर्शन गरिरहेका छन्।", language);
      return;
    }

    let text = "";
    if (language === 'en') {
      text = `There are ${logs.length} system alerts. `;
      const topAlerts = logs.slice(0, 3).map(l => `${l.indicatorNameEn || l.indicatorName} at ${l.progress} percent`).join(', ');
      text += `Key alerts include: ${topAlerts}.`;
    } else {
      text = `प्रणालीमा ${logs.length} वटा अलर्टहरू छन्। `;
      const topAlerts = logs.slice(0, 3).map(l => `${l.indicatorName} ${l.progress} प्रतिशतमा छ`).join(', ');
      text += `मुख्य अलर्टहरूमा: ${topAlerts} समावेश छन्।`;
    }
    speak(text, language);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col h-full" id="alert-log-dashboard-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
            <AlertCircle size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
              {language === 'en' ? 'Threshold Alert Log' : 'थ्रेसहोल्ड अलर्ट लग'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {language === 'en' ? 'Breached targets & levels' : 'उल्लंघन गरिएका लक्ष्य र स्तरहरू'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={speakAlertSummary}
            className="p-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent"
            title={language === 'en' ? 'Listen to alert summary' : 'अलर्ट सारांश सुन्नुहोस्'}
          >
            <Volume2 size={16} />
          </button>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-455 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              title={language === 'en' ? 'Clear alert history' : 'अलर्ट इतिहास मेटाउनुहोस्'}
              id="clear-alert-logs-btn"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto max-h-[22rem] px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 pr-2 -mr-2">
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sliders size={20} className="text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'en' ? 'No Threshold Breaches' : 'कुनै थ्रेसहोल्ड उल्लंघन छैन'}
            </p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
              {language === 'en' 
                ? 'Indicators are currently performing within their user-defined thresholds.' 
                : 'सूचकहरू हाल तिनीहरूको थ्रेसहोल्ड भित्र प्रदर्शन गरिरहेका छन्।'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 relative">
            {/* Timeline connector line */}
            <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-rose-100/40 dark:bg-rose-900/10 z-0" />

            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative pl-10 z-10 group text-left"
                >
                  {/* Timeline bullet */}
                  <div className="absolute left-0 top-1.5 w-9 h-9 rounded-full border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center transition-all group-hover:scale-105 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-450">
                    <Clock size={12} />
                  </div>

                  <div className="p-3 bg-rose-500/[0.02] dark:bg-rose-500/[0.01] border border-rose-500/10 dark:border-rose-400/5 rounded-2xl transition-all group-hover:bg-rose-500/[0.04] group-hover:border-rose-500/20">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-rose-500/80 dark:text-rose-400/80 block">
                          {log.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 leading-tight line-clamp-1">
                          {language === 'en' ? (log.indicatorNameEn || log.indicatorName) : log.indicatorName}
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-650 dark:text-slate-400 bg-white/50 dark:bg-slate-950/30 p-1.5 rounded-lg border border-slate-100/50 dark:border-slate-800/20 font-sans">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-slate-450 dark:text-slate-500">
                          {language === 'en' ? 'Threshold:' : 'थ्रेसहोल्ड:'}
                        </span>
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                          {log.threshold}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-slate-450 dark:text-slate-500">
                          {language === 'en' ? 'Breached at:' : 'उल्लंघन विन्दु:'}
                        </span>
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                          {log.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
