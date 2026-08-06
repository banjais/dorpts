import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, HelpCircle, X, Calculator, Target, TrendingUp, Search, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface WeightFormulaTooltipProps {
  indicators?: Indicator[];
  selectedIndicator?: Indicator;
  buttonClassName?: string;
  showModalOnClick?: boolean;
}

export const WeightFormulaTooltip: React.FC<WeightFormulaTooltipProps> = ({
  indicators = [],
  selectedIndicator,
  buttonClassName = '',
  showModalOnClick = true,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const displayIndicators = indicators.length > 0 ? indicators : (selectedIndicator ? [selectedIndicator] : []);

  const totalWeight = displayIndicators.reduce((sum, ind) => sum + (ind.weight || 0), 0);
  
  const totalWeightedContribution = displayIndicators.reduce((sum, ind) => {
    const target = ind.annualTarget > 0 ? ind.annualTarget : (ind.target > 0 ? ind.target : 0);
    const progress = ind.annualProgress !== undefined && ind.annualProgress !== null ? ind.annualProgress : (ind.progress || 0);
    const weight = ind.weight || 0;
    const pct = target > 0 ? (progress / target) * 100 : 0;
    return sum + (pct * (weight / 100));
  }, 0);

  const filteredIndicators = displayIndicators.filter((ind) => {
    const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || ind.category?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      {/* Header Trigger Tooltip Button */}
      <div className="inline-flex items-center gap-1 group relative">
        <button
          type="button"
          onClick={() => showModalOnClick && setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[0.6875rem] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/60 transition-all duration-200 cursor-pointer shadow-xs ${buttonClassName}`}
          title={language === 'en' ? 'Click to inspect raw formula & sheet values' : 'कच्चा सूत्र र डेटा विवरण हेर्न थिच्नुहोस्'}
        >
          <Calculator size={12} className="text-indigo-500 animate-pulse" />
          <span>{language === 'en' ? 'Formula' : 'सूत्र'}</span>
          <Info size={11} className="text-indigo-400 group-hover:scale-110 transition-transform" />
        </button>

        {/* Hover Quick Preview Tooltip */}
        <div className="absolute top-full left-0 mt-2 hidden group-hover:flex flex-col w-72 p-3 bg-slate-900/98 dark:bg-slate-950/98 text-slate-100 rounded-xl shadow-2xl border border-slate-700/80 dark:border-slate-800 z-50 pointer-events-none text-left backdrop-blur-md">
          <div className="flex items-center gap-1.5 mb-1 text-indigo-400 font-bold text-xs">
            <Calculator size={13} />
            <span>{language === 'en' ? 'Indicator Weight Formula' : 'सूचक भार गणना सूत्र'}</span>
          </div>
          <p className="text-[0.6875rem] text-slate-300 leading-relaxed mb-2">
            {language === 'en' 
              ? 'Derived directly from Google Sheet Target & Achievement columns:'
              : 'गूगल शिटको लक्ष र उपलब्धि कोलमहरूबाट सीधा निकालिएको:'}
          </p>
          <div className="bg-slate-950 p-2 rounded-lg font-mono text-[0.625rem] text-indigo-300 border border-slate-800 space-y-1">
            <div><span className="text-slate-400">Progress % =</span> (Achievement / Target) × 100</div>
            <div><span className="text-slate-400">Contribution =</span> (Progress % × Weight) / 100</div>
          </div>
          <span className="text-[0.5625rem] text-indigo-400 mt-2 font-semibold">
            {language === 'en' ? '👉 Click for full interactive sheet breakdown' : '👉 विस्तृत गणितीय तालिकाको लागि थिच्नुहोस्'}
          </span>
        </div>
      </div>

      {/* Interactive Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Calculator size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {language === 'en' ? 'Indicator Weight & Contribution Formula' : 'सूचक भार र योगदान सूत्र'}
                      <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        {language === 'en' ? 'Google Sheet Live Data' : 'गूगल शिट प्रत्यक्ष डेटा'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'en' 
                        ? 'Raw Target vs Achievement data and resulting weighted formula values'
                        : 'कच्चा लक्ष्य विरूद्ध उपलब्धि डेटा र भारित योगदान नतिजाहरू'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
                {/* Mathematical Formula Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs mb-2">
                      <Target size={15} />
                      <span>1. {language === 'en' ? 'Raw Progress %' : '१. कच्चा प्रगति %'}</span>
                    </div>
                    <div className="font-mono text-xs text-indigo-900 dark:text-indigo-100 font-bold bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                      Progress % = (Achievement / Target) × 100
                    </div>
                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-2">
                      {language === 'en' 
                        ? 'Raw achievement divided by the annual target derived from Google Sheet columns.'
                        : 'गूगल शिटका स्तम्भहरूबाट निकालिएको कुल बार्षिक लक्ष्यले उपलब्धिलाई भाग गरी १०० ले गुणन।'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs mb-2">
                      <TrendingUp size={15} />
                      <span>2. {language === 'en' ? 'Indicator Contribution' : '२. सूचकको खुद योगदान'}</span>
                    </div>
                    <div className="font-mono text-xs text-teal-900 dark:text-teal-100 font-bold bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/60">
                      Weighted Pt = (Progress % × Weight) / 100
                    </div>
                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-2">
                      {language === 'en' 
                        ? 'Individual weighted score points calculated for this specific indicator.'
                        : 'यस सूचकले कुल अङ्कमा थप्ने खुद भारित अङ्क।'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs mb-2">
                      <FileSpreadsheet size={15} />
                      <span>3. {language === 'en' ? 'Department Total Score' : '३. विभागको कुल नतिजा'}</span>
                    </div>
                    <div className="font-mono text-xs text-amber-900 dark:text-amber-100 font-bold bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/60">
                      Total Score = Σ (Weighted Pt) / Σ (Weights)
                    </div>
                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 mt-2">
                      {language === 'en' 
                        ? 'Departmental weighted score aggregate calculated across all indicators.'
                        : 'सबै सूचकहरूको कुल भारित अङ्कको योगफल।'}
                    </p>
                  </div>
                </div>

                {/* Summary Metrics Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <div>
                      <span className="text-[0.6875rem] text-slate-400 font-bold uppercase tracking-wider block">
                        {language === 'en' ? 'Tracked Indicators' : 'कुल ट्र्याक गरिएका सूचकहरू'}
                      </span>
                      <span className="text-base font-black text-white">{displayIndicators.length} {language === 'en' ? 'Items' : 'सूचकहरू'}</span>
                    </div>
                  </div>

                  <div className="border-r border-slate-800 h-8 hidden md:block" />

                  <div>
                    <span className="text-[0.6875rem] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Total Assigned Weight' : 'कुल भारित अङ्क'}
                    </span>
                    <span className="text-base font-black text-indigo-400">{totalWeight} {language === 'en' ? 'Points' : 'अङ्क'}</span>
                  </div>

                  <div className="border-r border-slate-800 h-8 hidden md:block" />

                  <div>
                    <span className="text-[0.6875rem] text-slate-400 font-bold uppercase tracking-wider block">
                      {language === 'en' ? 'Calculated Weighted Score' : 'भारित कुल योगदान SCORE'}
                    </span>
                    <span className="text-base font-black text-emerald-400">{totalWeightedContribution.toFixed(2)} %</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={language === 'en' ? 'Filter indicator data by name or category...' : 'सूचक वा वर्गको नामले खोज्नुहोस्...'}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {filteredIndicators.length} / {displayIndicators.length} {language === 'en' ? 'Indicators' : 'सूचकहरू'}
                  </span>
                </div>

                {/* Raw Values Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">{language === 'en' ? 'Indicator Name' : 'सूचकको नाम'}</th>
                        <th className="p-3 text-right">{language === 'en' ? 'Raw Target' : 'वार्षिक लक्ष्य'}</th>
                        <th className="p-3 text-right">{language === 'en' ? 'Raw Achievement' : 'वार्षिक उपलब्धि'}</th>
                        <th className="p-3 text-right">{language === 'en' ? 'Progress %' : 'प्रगति %'}</th>
                        <th className="p-3 text-center">{language === 'en' ? 'Weight' : 'भार'}</th>
                        <th className="p-3 text-right">{language === 'en' ? 'Weighted Points' : 'भारित अङ्क'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredIndicators.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                            {language === 'en' ? 'No matching indicators found.' : 'कुनै सूचक फेला परेन।'}
                          </td>
                        </tr>
                      ) : (
                        filteredIndicators.map((ind, idx) => {
                          const target = ind.annualTarget > 0 ? ind.annualTarget : (ind.target > 0 ? ind.target : 0);
                          const progress = ind.annualProgress !== undefined && ind.annualProgress !== null ? ind.annualProgress : (ind.progress || 0);
                          const pct = target > 0 ? Math.round((progress / target) * 100) : 0;
                          const weight = ind.weight || 0;
                          const weightedPts = Math.round((pct * (weight / 100)) * 100) / 100;
                          const name = language === 'en' ? (ind.nameEn || ind.name) : ind.name;

                          return (
                            <tr key={ind.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900 dark:text-white leading-snug">{name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{ind.category || '-'}</div>
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {target.toLocaleString()} <span className="text-[10px] text-slate-400">{ind.unit}</span>
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                                {progress.toLocaleString()} <span className="text-[10px] text-slate-400">{ind.unit}</span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold">
                                <span className={pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>
                                  {pct}%
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                {weight}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20">
                                +{weightedPts}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Info size={14} />
                  <span>{language === 'en' ? 'Calculated live from synced Google Sheet values.' : 'प्रत्यक्ष गूगल शिटबाट स्वचालित गणना।'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
                >
                  {language === 'en' ? 'Close Window' : 'बन्द गर्नुहोस्'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WeightFormulaTooltip;
