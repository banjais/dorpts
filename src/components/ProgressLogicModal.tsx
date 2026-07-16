import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, CheckCircle2, AlertTriangle, Clock, Calculator, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getBreakdownStatus } from '../utils/status';
import { Indicator } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const toNepaliNumerals = (n: string | number): string => {
  const map: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };
  return String(n).split('').map((c) => map[c] ?? c).join('');
};

interface ProgressLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: Indicator[];
  language: 'en' | 'ne';
}

export const ProgressLogicModal: React.FC<ProgressLogicModalProps> = ({
  isOpen,
  onClose,
  indicators,
  language,
}) => {
  useBodyScrollLock(isOpen);

  const safeIndicators = Array.isArray(indicators) ? indicators : [];

  const weightedRate = useMemo(() => {
    const totalWeight = safeIndicators.reduce((acc, curr) => acc + (curr?.weight || 0), 0) || 100;
    const achievedWeight = safeIndicators.reduce((acc, curr) => {
      if (!curr) return acc;
      const target = curr.annualTarget || 0;
      const progress = curr.annualProgress || 0;
      const achievement = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
      return acc + (achievement * ((curr.weight || 0) / 100));
    }, 0);
    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  }, [safeIndicators]);

  const status = useMemo(() => {
    const map: Record<string, number> = { onTrack: 0, needsAttention: 0, stale: 0 };
    safeIndicators.forEach((ind) => {
      if (!ind) return;
      const s = getBreakdownStatus(ind);
      map[s] += 1;
    });
    return { onTrack: map.onTrack, needsAttention: map.needsAttention, stale: map.stale };
  }, [safeIndicators]);

  const num = (n: number) => (language === 'ne' ? toNepaliNumerals(n) : n);
  const displayRate = num(weightedRate);

  const statusItems = [
    { key: 'onTrack', labelEn: 'On Track', labelNp: 'अनुसरण', value: status.onTrack, color: '#10b981' },
    { key: 'needsAttention', labelEn: 'Needs Attention', labelNp: 'ध्यान', value: status.needsAttention, color: '#f59e0b' },
    { key: 'stale', labelEn: 'Stale', labelNp: 'पुरानो', value: status.stale, color: '#ef4444' },
  ];

  const maxStatus = Math.max(status.onTrack, status.needsAttention, status.stale, 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden max-h-[90dvh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'Overall Progress' : 'समग्र प्रगति'}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Strategic Weighted Average' : 'रणनीतिक भारित औसत'}
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

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Big rate */}
              <div className="flex items-center gap-5">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="3.5" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={97.4}
                      initial={{ strokeDashoffset: 97.4 }}
                      animate={{ strokeDashoffset: 97.4 - (97.4 * weightedRate) / 100 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{displayRate}%</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    {language === 'en' ? 'Achievement Rate' : 'उपलब्धि दर'}
                  </p>
                  <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {language === 'en'
                      ? 'Weighted average completion across all active indicators.'
                      : 'सबै सक्रिय सूचकहरूमा भारित औसत पूरा हुने प्रगति।'}
                  </p>
                </div>
              </div>

              {/* Performance Algorithm */}
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Scale size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {language === 'en' ? 'Performance Algorithm' : 'कार्यसम्पादन विधि'}
                  </h4>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  {language === 'en'
                    ? `The system employs a Strategic Weighted Average (SWA) model. Critical infrastructure Indicators carry higher impact weights, ensuring the total percentage accurately reflects departmental priorities.`
                    : `प्रणालीले रणनीतिक भारित औसत (SWA) मोडेल प्रयोग गर्दछ। महत्त्वपूर्ण पूर्वाधार सूचकहरूको भार बढी हुन्छ, जसले समग्र प्रतिशतले विभागको प्राथमिकतालाई सही रूपमा प्रतिबिम्बित गर्दछ।`}
                </p>

                {/* Mathematical Formula Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 font-mono text-center shadow-lg">
                  <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4">
                    {language === 'en' ? 'Core Equation' : 'मुख्य समीकरण'}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'en' ? 'Total Score' : 'कुल स्कोर'} % =
                    </span>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 px-4">
                        Σ (Achievement % × Weight)
                      </span>
                      <div className="w-full h-px bg-slate-200 dark:bg-white/10 my-1" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-400">
                        Σ (Total Active Weight)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Divergence Clarification Box */}
                <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-[24px] p-5 text-left mt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
                      <Scale size={16} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                        {language === 'en' ? 'Strategic vs. Weighted Divergence' : 'रणनीतिक बनाम भारित कार्यसम्पादन'}
                      </h5>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                        {language === 'en'
                          ? 'Why are they sometimes equal? On our starting baseline data, both models align at around 78% due to balanced indicators. However, they use distinct mathematical formulas:'
                          : 'किन कहिलेकाहीँ समान देखिन्छन्? सुरुवाती आधारभूत तथ्याङ्कमा, दुवै मोडेलहरू लगभग ७८% मा सन्तुलित देखिन्छन्। तर यिनीहरूले फरक गणितीय सूत्र प्रयोग गर्दछन्:'}
                      </p>
                      <ul className="list-disc pl-4 mt-2 space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
                        <li>
                          <strong>{language === 'en' ? 'Strategic Average' : 'रणनीतिक औसत'}</strong>:{' '}
                          {language === 'en'
                            ? 'Treats each of the 5 high-impact sectors with equal 20% importance (e.g., Infrastructure progress counts as 20%, Budget counts as 20% of the overall score).'
                            : 'पाँचवटै उच्च-प्रभाव क्षेत्रहरूलाई समान २०% महत्त्व दिन्छ (जस्तै पूर्वाधारको प्रगति २०%, बजेटको प्रगति २०%)।'}
                        </li>
                        <li>
                          <strong>{language === 'en' ? 'Weighted Average' : 'भारित औसत'}</strong>:{' '}
                          {language === 'en'
                            ? 'Ignores sector groupings and scales strictly based on each of the 17 indicators individual priority weight.'
                            : 'क्षेत्रगत समूहहरूलाई छोडेर प्रत्येक १७ सूचकहरूको व्यक्तिगत प्राथमिकता भारको आधारमा मात्र स्क्यालिङ गर्दछ।'}
                        </li>
                      </ul>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2 italic">
                        {language === 'en'
                          ? '→ As progress updates flow in, these two percentages will dynamically diverge!'
                          : '→ प्रगति विवरणहरू अद्यावधिक हुँदा, यी दुई प्रतिशतहरू फरक-फरक दरमा परिवर्तन हुनेछन्!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight Breakdown - Bento Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm group hover:border-indigo-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                    <Target size={16} />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                    {language === 'en' ? 'High Impact' : 'उच्च प्रभाव'}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'en'
                      ? 'Core Indicators like Road Blacktopping and Bridge completion are prioritized with weights up to 40%.'
                      : 'सडक कालोपत्रे र पुल निर्माण जस्ता मुख्य सूचकहरूलाई ४०% सम्मको भारका साथ प्राथमिकता दिइन्छ।'}
                  </p>
                </div>
                <div className="p-6 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm group hover:border-blue-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                    <Activity size={16} />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                    {language === 'en' ? 'Balanced Portfolio' : 'सन्तुलित पोर्टफोलियो'}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'en'
                      ? 'Secondary tasks (gravel roads, minor repairs) are monitored with 0 weight to track but not skew averages.'
                      : 'दोस्रो कार्यहरू (ग्राभेल, सानो मर्मत) लाई औसत नबिग्रियोस् भन्नका लागि ० भारका साथ अनुगमन गरिन्छ।'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
