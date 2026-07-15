import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, CircleAlert } from 'lucide-react';

interface BudgetEntry {
  label: string;
  allocation: number;
  expenditure: number;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
  budget?: BudgetEntry[];
  currency?: string;
}

const toNepaliNumerals = (n: string | number): string => {
  const map: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };
  return String(n).split('').map((c) => map[c] ?? c).join('');
};

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  language,
  budget = [],
  currency = 'NPR',
}) => {
  const num = (n: number) => (language === 'ne' ? toNepaliNumerals(n) : n);
  const hasData = budget.length > 0;
  const totalAlloc = budget.reduce((s, b) => s + b.allocation, 0);
  const totalExp = budget.reduce((s, b) => s + b.expenditure, 0);
  const utilization = totalAlloc > 0 ? Math.round((totalExp / totalAlloc) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[550] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                  <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'Budget' : 'बजेट'}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Allocation vs Expenditure' : 'विनियोजन बनाम खर्च'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {hasData ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Allocated' : 'विनियोजित'}
                      </p>
                      <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        {num(totalAlloc)} <span className="text-[10px] font-bold text-slate-400">{currency}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Spent' : 'खर्च'}
                      </p>
                      <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                        {num(totalExp)} <span className="text-[10px] font-bold text-slate-400">{currency}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl p-3.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/40">
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">
                        {language === 'en' ? 'Utilization' : 'उपयोग'}
                      </p>
                      <p className="text-lg font-black text-amber-700 dark:text-amber-200 mt-1">{num(utilization)}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {budget.map((b) => {
                      const pct = b.allocation > 0 ? Math.round((b.expenditure / b.allocation) * 100) : 0;
                      return (
                        <div key={b.label} className="rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{b.label}</span>
                            <span className="text-[11px] font-black text-slate-800 dark:text-white">
                              {num(b.expenditure)}/{num(b.allocation)} {currency}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                    <CircleAlert className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-[13px] font-black text-slate-800 dark:text-white">
                    {language === 'en' ? 'Budget data not configured' : 'बजेट डाटा कन्फिगुर गरिएको छैन'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                    {language === 'en'
                      ? 'Add a budget column (allocation & expenditure) to the data source and it will appear here automatically with utilization.'
                      : 'डाटा स्रोतमा बजेट स्तम्भ (विनियोजन र खर्च) थप्नुहोस्, यहाँ स्वतः उपयोग दरसँग देखिनेछ।'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
