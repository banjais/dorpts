import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Indicator, SystemMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { EmptyState } from './EmptyState';
import { Building2, Activity, Database, Brain, ShieldAlert, Search, Trophy, Award, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  offices?: { name: string; updated: string; avgCompletion?: number; total?: number; shortName?: string }[];
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
  { id: 'leaderboard', labelEn: 'LEADERBOARD', labelNp: 'लीडरबोर्ड', icon: <Trophy size={16} /> },
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
  const [leaderboardFilter, setLeaderboardFilter] = React.useState<'all' | 'top' | 'lagging'>('all');
  const [sortAscending, setSortAscending] = React.useState(false);

  const activeOfficesCount = React.useMemo(() => {
    const offices = new Set<string>();
    indicators.forEach(ind => { if (ind.office) offices.add(ind.office); });
    return offices.size;
  }, [indicators]);

  // Full office directory: prefer the live office list, fall back to the master list
  const officeDirectory = React.useMemo(() => {
    return offices.length > 0 ? offices : DOR_OFFICES_LIST;
  }, [offices]);

  const leaderboardStats = React.useMemo(() => {
    const list = [...officeDirectory];
    const withScore = list.map((off) => ({
      ...off,
      score: typeof off.avgCompletion === 'number' ? off.avgCompletion : 0,
    }));

    // Ranked list sorted strictly in descending order to preserve absolute rank
    const ranked = [...withScore].sort((a, b) => b.score - a.score);

    const topOffice = ranked[0] || null;
    const avgContribution = ranked.length > 0
      ? Math.round(ranked.reduce((acc, curr) => acc + curr.score, 0) / ranked.length)
      : 0;
    const topPerformers = ranked.filter((o) => o.score >= 70);
    const laggingOffices = ranked.filter((o) => o.score < 50);

    return {
      ranked,
      topOffice,
      avgContribution,
      topCount: topPerformers.length,
      laggingCount: laggingOffices.length,
    };
  }, [officeDirectory]);

  const displayLeaderboard = React.useMemo(() => {
    let list = [...leaderboardStats.ranked];
    if (leaderboardFilter === 'top') {
      list = list.filter((o) => o.score >= 70);
    } else if (leaderboardFilter === 'lagging') {
      list = list.filter((o) => o.score < 50);
    }

    if (officeSearch.trim()) {
      const q = officeSearch.trim().toLowerCase();
      list = list.filter((o) => {
        const nameToSearch = language === 'en' ? translateOffice(o.name) : o.name;
        return (
          nameToSearch.toLowerCase().includes(q) ||
          (o.shortName || '').toLowerCase().includes(q) ||
          (o.name || '').toLowerCase().includes(q)
        );
      });
    }

    if (sortAscending) {
      list = [...list].reverse();
    }

    return list;
  }, [leaderboardStats.ranked, leaderboardFilter, officeSearch, sortAscending, language, translateOffice]);

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
                  <EmptyState
                    icon={<Search size={24} className="text-slate-300 dark:text-slate-600" />}
                    title={language === 'en' ? 'No results matched your query' : 'कुनै नतिजा फेला परेन'}
                    description={language === 'en' ? 'Try different search terms or filters' : 'फरक खोज शब्द वा फिल्टरहरू प्रयास गर्नुहोस्'}
                    className="py-8"
                  />
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

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Top Office Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/5 dark:to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                    {language === 'en' ? 'Top Performer' : 'शीर्ष प्रदर्शनकारी'}
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {leaderboardStats.topOffice
                      ? (language === 'en' ? translateOffice(leaderboardStats.topOffice.name) : leaderboardStats.topOffice.name)
                      : 'N/A'}
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                    {leaderboardStats.topOffice ? `${leaderboardStats.topOffice.score}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Avg Contribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Target size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {language === 'en' ? 'Average Contribution' : 'औसत योगदान'}
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {language === 'en' ? `${leaderboardStats.avgContribution}%` : `${toNepaliNumerals(leaderboardStats.avgContribution)}%`}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {language === 'en' ? 'Across all field units' : 'सबै क्षेत्रीय कार्यालयहरूमा'}
                  </span>
                </div>
              </div>

              {/* Top Performers Count */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {language === 'en' ? 'High Performers (≥70%)' : 'उच्च प्रदर्शनकर्ता (≥७०%)'}
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {language === 'en' ? `${leaderboardStats.topCount} Offices` : `${toNepaliNumerals(leaderboardStats.topCount)} कार्यालयहरू`}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {language === 'en' ? 'Meeting annual benchmarks' : 'वार्षिक लक्ष्य हासिल'}
                  </span>
                </div>
              </div>

              {/* Lagging Count */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    {language === 'en' ? 'Lagging Offices (<50%)' : 'पछि परेका कार्यालयहरू (<५०%)'}
                  </span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                    {language === 'en' ? `${leaderboardStats.laggingCount} Offices` : `${toNepaliNumerals(leaderboardStats.laggingCount)} कार्यालयहरू`}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {language === 'en' ? 'Needs focused intervention' : 'विशेष ध्यान आवश्यक'}
                  </span>
                </div>
              </div>
            </div>

            {/* Weighted Formula Diagnostic Verification Banner */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
                <Target size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold">
                    {language === 'en' ? 'Verified Calculation Formula: ' : 'प्रमाणित गणना सूत्र: '}
                  </span>
                  <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                    Contribution % = Σ [ min(100, (Office Target / System Target) × 100) × Indicator Weight ] / Σ (Indicator Weights)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-mono text-[10px] font-bold shrink-0">
                Live Google Sheet Sync Verified
              </span>
            </div>

            {/* Filter & Controls Toolbar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Filter leaderboard offices...' : 'कार्यालयहरू खोज्नुहोस्...'}
                    value={officeSearch}
                    onChange={(e) => setOfficeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setLeaderboardFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      leaderboardFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'en' ? `All (${leaderboardStats.ranked.length})` : `सबै (${toNepaliNumerals(leaderboardStats.ranked.length)})`}
                  </button>

                  <button
                    onClick={() => setLeaderboardFilter('top')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      leaderboardFilter === 'top'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp size={13} />
                    {language === 'en' ? `Top (${leaderboardStats.topCount})` : `शीर्ष (${toNepaliNumerals(leaderboardStats.topCount)})`}
                  </button>

                  <button
                    onClick={() => setLeaderboardFilter('lagging')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      leaderboardFilter === 'lagging'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingDown size={13} />
                    {language === 'en' ? `Lagging (${leaderboardStats.laggingCount})` : `पछि परेका (${toNepaliNumerals(leaderboardStats.laggingCount)})`}
                  </button>

                  {/* Sort Direction Toggle */}
                  <button
                    onClick={() => setSortAscending(!sortAscending)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    title={language === 'en' ? 'Toggle Sort Order' : 'क्रम बदल्नुहोस्'}
                  >
                    {sortAscending ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {sortAscending ? (language === 'en' ? 'Lowest First' : 'न्यूनतम पहिले') : (language === 'en' ? 'Highest First' : 'उच्चतम पहिले')}
                  </button>
                </div>
              </div>

              {/* Ranked Office Cards */}
              <div className="space-y-2.5">
                {displayLeaderboard.map((off) => {
                  const absoluteRank = leaderboardStats.ranked.findIndex((r) => r.name === off.name) + 1;
                  const isTop3 = absoluteRank <= 3;

                  let badgeBg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  let medalIcon = null;
                  if (absoluteRank === 1) {
                    badgeBg = 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-500/20';
                    medalIcon = <Trophy size={14} className="fill-slate-950" />;
                  } else if (absoluteRank === 2) {
                    badgeBg = 'bg-slate-300 dark:bg-slate-300 text-slate-900 font-black border-slate-100 shadow-sm';
                    medalIcon = <Award size={14} />;
                  } else if (absoluteRank === 3) {
                    badgeBg = 'bg-amber-700 text-amber-50 font-black border-amber-600 shadow-sm';
                    medalIcon = <Award size={14} />;
                  }

                  let statusTextEn = 'Moderate';
                  let statusTextNp = 'मध्यम';
                  let statusColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                  let progressGradient = 'from-amber-500 to-amber-600';

                  if (off.score >= 70) {
                    statusTextEn = 'Excellent';
                    statusTextNp = 'उत्कृष्ट';
                    statusColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                    progressGradient = 'from-emerald-500 to-teal-600';
                  } else if (off.score < 50) {
                    statusTextEn = 'Lagging';
                    statusTextNp = 'ध्यान आवश्यक';
                    statusColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                    progressGradient = 'from-rose-500 to-red-600';
                  }

                  const displayName = language === 'en' ? translateOffice(off.name) : off.name;

                  return (
                    <motion.div
                      key={off.name}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isTop3
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-amber-500/30 dark:border-amber-500/20 shadow-sm'
                          : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Rank + Name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center text-xs shrink-0 ${badgeBg}`}>
                          {medalIcon || `#${absoluteRank}`}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {displayName}
                            </h4>
                            {off.shortName && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                                {off.shortName}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            {language === 'en' ? 'Last update:' : 'अन्तिम अद्यावधिक:'} {off.updated || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Progress Bar & Score */}
                      <div className="flex items-center gap-4 sm:w-72 shrink-0">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                              {language === 'en' ? statusTextEn : statusTextNp}
                            </span>
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                              {off.score}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, Math.max(0, off.score))}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${progressGradient}`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {displayLeaderboard.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                      <Trophy size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {language === 'en' ? 'No offices match the selected leaderboard criteria' : 'कुनै कार्यालय फेला परेन'}
                    </p>
                  </div>
                )}
              </div>
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
