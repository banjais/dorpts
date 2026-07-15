import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Building2, Activity, Database, Brain, ShieldAlert, Search } from 'lucide-react';
import { DOR_OFFICES_LIST } from '../data';
import { RecentActivityLog } from './RecentActivityLog';
import { DataLog, DataAnomalyDetection, DataIntegrityMonitor } from './InstitutionalSections';
import { OfficeCard } from './OfficeCard';

interface InstitutionalViewProps {
  indicators: Indicator[];
  metadata: SystemMetadata | null;
  onOpenAbout?: (tab?: string) => void;
  updatesHistory: any[];
  sheetUpdates?: any[];
  offices?: { name: string; updated: string }[];
  onViewActivityDetail?: () => void;
  onViewFullAuditTrail?: () => void;
  retryKey?: number;
}

const toNepaliNumerals = (num: string | number): string => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().replace(/\d/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
};

const INST_TABS = [
  { id: 'offices', labelEn: 'OFFICES', labelNp: 'कार्यालय', icon: <Building2 size={16} /> },
  { id: 'activity', labelEn: 'ACTIVITY', labelNp: 'गतिविधि', icon: <Activity size={16} /> },
  { id: 'log', labelEn: 'DATA LOG', labelNp: 'डाटा लग', icon: <Database size={16} /> },
  { id: 'anomaly', labelEn: 'ANOMALY', labelNp: 'विसंगति', icon: <Brain size={16} /> },
  { id: 'integrity', labelEn: 'INTEGRITY', labelNp: 'अखण्डता', icon: <ShieldAlert size={16} /> },
] as const;

type InstTabId = typeof INST_TABS[number]['id'];

export const InstitutionalView: React.FC<InstitutionalViewProps> = ({
  indicators,
  metadata,
  onOpenAbout,
  updatesHistory,
  sheetUpdates = [],
  offices = [],
  onViewActivityDetail,
  onViewFullAuditTrail,
  retryKey
}) => {
  const { language, translateOffice } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<InstTabId>('offices');
  const [officeSearch, setOfficeSearch] = React.useState('');

  const activeOfficesCount = React.useMemo(() => {
    const offices = new Set<string>();
    indicators.forEach(ind => { if (ind.office) offices.add(ind.office); });
    return offices.size;
  }, [indicators]);

  // Full office directory: prefer the live office list, fall back to the master list
  const officeDirectory = React.useMemo(() => {
    return offices.length > 0 ? offices : DOR_OFFICES_LIST;
  }, [offices]);

  const filteredOffices = React.useMemo(() => {
    const q = officeSearch.trim().toLowerCase();
    if (!q) return officeDirectory;
    return officeDirectory.filter(o => {
      const nameToSearch = language === 'en' ? translateOffice(o.name) : o.name;
      return nameToSearch.toLowerCase().includes(q);
    });
  }, [officeDirectory, officeSearch, language, translateOffice]);

  const mergedHistory = React.useMemo(() => {
    const merged = [...sheetUpdates, ...updatesHistory];
    return merged.sort((a, b) => {
      const dateA = new Date((a.lastUpdateDate || a.id || '') as string).getTime();
      const dateB = new Date((b.lastUpdateDate || b.id || '') as string).getTime();
      return dateB - dateA;
    });
  }, [sheetUpdates, updatesHistory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header + right-aligned tab switcher (NavigationMenu style) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-8">
        <div className="border-l-2 border-cyan-600 dark:border-cyan-400 pl-4">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
            {language === 'en' ? 'Institutional' : 'संस्थागत'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'en'
              ? 'Office directories, recent activity logs, and tracking logs.'
              : 'कार्यालय निर्देशिका, गतिविधि फिड र ट्र्याकिङ लगहरू।'}
          </p>
        </div>

        <nav className="self-start md:self-center">
          <div className="flex flex-row items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 p-0.5 sm:p-1 rounded-full border border-white/70 dark:border-slate-700/50 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
            {INST_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-colors duration-200 flex items-center gap-1 justify-center z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-white'
                  }`}
                  title={language === 'en' ? tab.labelEn : tab.labelNp}
                >
                  {isActive && (
                    <motion.div
                      layoutId="instTabActivePill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-full brand-gradient shadow-md shadow-indigo-500/30 ring-1 ring-white/20"
                    >
                      <div className="absolute inset-0 rounded-full opacity-60 blur-sm brand-gradient" />
                    </motion.div>
                  )}
                  <span className={isActive ? 'drop-shadow' : ''}>{tab.icon}</span>
                  <span className={`font-display text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-opacity ${isActive ? 'inline opacity-100' : 'hidden sm:inline opacity-70'}`}>
                    {language === 'en' ? tab.labelEn : tab.labelNp}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'offices' && (
          <motion.div
            key="offices"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 sm:p-6 shadow-xl border border-slate-100 dark:border-white/5 flex flex-col flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none" />

              {/* Header + live count */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                      {language === 'en' ? 'Offices' : 'कार्यालयहरू'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {language === 'en'
                        ? `${activeOfficesCount || officeDirectory.length} Active Units`
                        : `${toNepaliNumerals(activeOfficesCount || officeDirectory.length)} सक्रिय एकाइहरू`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === 'en' ? 'Total' : 'कुल'}</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {language === 'en' ? officeDirectory.length : toNepaliNumerals(officeDirectory.length)}
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative group mb-3 relative z-10">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search engaged offices...' : 'कार्यालयहरू खोज्नुहोस्...'}
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                />
              </div>

              {/* Office list */}
              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar relative z-10">
                {filteredOffices.map((office, idx) => (
                  <OfficeCard key={`${office.name}-${idx}`} office={office} variant="row" />
                ))}
                {filteredOffices.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                      <Search size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {language === 'en' ? 'No results matched your query' : 'कुनै नतिजा फेला परेन'}
                    </p>
                  </div>
                )}
              </div>

              {/* Explore full directory */}
              <button
                onClick={() => onOpenAbout?.('offices')}
                className="mt-4 w-full py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center gap-2 relative z-10 cursor-pointer border border-transparent"
              >
                {language === 'en' ? 'Explore Units' : 'एकाइहरू हेर्नुहोस्'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <RecentActivityLog
              updatesHistory={mergedHistory}
              metadata={metadata}
              limit={6}
              compact={false}
              onViewFullAuditTrail={onViewFullAuditTrail}
            />
          </motion.div>
        )}

        {activeTab === 'log' && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <DataLog
              indicators={indicators}
              metadata={metadata}
              onViewActivityDetail={onViewActivityDetail}
            />
          </motion.div>
        )}

        {activeTab === 'anomaly' && (
          <motion.div
            key="anomaly"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <DataAnomalyDetection
              indicators={indicators}
              retryKey={retryKey}
              onViewActivityDetail={onViewActivityDetail}
            />
          </motion.div>
        )}

        {activeTab === 'integrity' && (
          <motion.div
            key="integrity"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <DataIntegrityMonitor indicators={indicators} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
