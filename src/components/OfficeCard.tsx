import React from 'react';
import { motion } from 'motion/react';
import { Building2, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OfficeCardProps {
  office: { name: string; updated?: string };
  /** 'grid' matches the animated cards in the System Info modal; 'row' matches the inline Institutional directory. */
  variant?: 'grid' | 'row';
  /** Stagger index used only by the 'grid' variant animation. */
  index?: number;
}

/**
 * Shared office directory card used by both the Institutional view and the
 * System Info (offices) modal so the ID parsing and status rendering stay in sync.
 */
export const OfficeCard: React.FC<OfficeCardProps> = ({ office, variant = 'row', index = 0 }) => {
  const { language, translateOffice } = useLanguage();
  const officeId = office.name.split('-')[0] || 'DOR';
  const isGrid = variant === 'grid';
  const translated = translateOffice(office.name);
  const displayName = translated.includes('-')
    ? translated.split('-').slice(1).join('-').trim()
    : translated;

  const inner = (
    <>
      <div
        className={`${
          isGrid ? 'w-10 h-10 bg-slate-50 dark:bg-slate-950' : 'w-9 h-9 bg-white dark:bg-slate-900'
        } rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0`}
      >
        <Building2 size={isGrid ? 18 : 16} />
      </div>
      <div className="min-w-0">
        <p
          className={`${
            isGrid ? 'text-sm' : 'text-xs'
          } font-black text-slate-900 dark:text-white leading-snug`}
        >
          {displayName}
        </p>
        <div className={`flex items-center gap-2 ${isGrid ? 'mt-1.5' : 'mt-1'}`}>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            ID: {officeId}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <Activity size={10} className="animate-pulse" />
            {language === 'en' ? 'Active' : 'सक्रिय'}
          </span>
        </div>
      </div>
    </>
  );

  if (isGrid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group flex items-start gap-4 shadow-sm"
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group flex items-start gap-3">
      {inner}
    </div>
  );
};
