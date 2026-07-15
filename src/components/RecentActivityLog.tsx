import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Clock, History, ArrowUpRight, User, Calendar, Activity } from 'lucide-react';
import { SystemMetadata } from '../types';

interface RecentActivityLogProps {
  updatesHistory: any[];
  metadata: SystemMetadata | null;
  limit?: number;
  compact?: boolean;
  onSelectEntry?: (entry: any) => void;
  onViewFullAuditTrail?: () => void;
}

export const RecentActivityLog: React.FC<RecentActivityLogProps> = ({ 
  updatesHistory, 
  metadata, 
  limit = 10,
  compact = false,
  onSelectEntry,
  onViewFullAuditTrail
}) => {
  const { language, t } = useLanguage();

  const toNepaliNumerals = (numStr: string | number): string => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(numStr).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return language === 'np' ? toNepaliNumerals(dateStr) : dateStr;
  };

  if (!updatesHistory || updatesHistory.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-black/40 flex flex-col h-full ${compact ? '' : 'p-6 sm:p-8'}`}>
      <div className={`flex items-center justify-between mb-4 ${compact ? 'px-6 pt-6' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
              {language === 'en' ? 'Recent Activity Log' : 'हालैको गतिविधि लग'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              {language === 'en' ? 'System Updates & Snapshots' : 'प्रणाली अद्यावधिक र स्न्यापसटहरू'}
            </p>
          </div>
        </div>
        <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
          {updatesHistory.length} {language === 'en' ? 'Entries' : 'विवरणहरू'}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 ${compact ? 'px-6 pb-6' : ''}`}>
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {updatesHistory.slice(0, limit).map((entry, idx) => {
              const dateStr = entry.lastUpdateDate || entry.id;
              const updatedBy = entry.metadata?.updatedBy || (language === 'en' ? 'Not provided' : 'प्रदान गरिएको छैन');
              const indicatorCount = entry.indicators?.length || 0;

              return (
                <motion.div
                  key={entry.id || idx}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-start gap-3 py-2.5 border-b border-slate-50 dark:border-white/5 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                        {idx === 0 ? (language === 'en' ? 'Latest Update' : 'पछिल्लो अद्यावधिक') : formatDate(dateStr)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {language === 'en' ? `Synced ${indicatorCount} indicators` : `${toNepaliNumerals(indicatorCount)} सूचक सिङ्क`}
                      </span>
                      {idx === 0 && entry.metadata?.totalWeightProgress && (
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                          {language === 'en' ? 'Weight:' : 'भार:'} {entry.metadata.totalWeightProgress}%
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={updatedBy}>
                      {language === 'en' ? 'by' : 'द्वारा'} {updatedBy}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
          <button onClick={onViewFullAuditTrail} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto">
            {language === 'en' ? 'View Full Audit Trail' : 'पूरा अडिट ट्रेल हेर्नुहोस्'}
            <ArrowUpRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
