import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export const SplashScreen = ({ isLoaded, fiscalYear }: { isLoaded: boolean; fiscalYear?: string }) => {
  const [progress, setProgress] = useState(0);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!isLoaded) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          const remaining = 85 - prev;
          const next = prev + (remaining > 40 ? 1 : remaining > 15 ? 0.5 : 0.3);
          return Math.min(next, 85);
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [isLoaded]);

  const displayProgress = isLoaded ? 100 : Math.round(progress);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoaded ? 0 : 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden aurora-bg"
      style={{ pointerEvents: isLoaded ? 'none' : 'auto' }}
    >
      {/* App Purpose at Center */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div className="flex flex-col items-center">
            {/* Emblem with rotating conic ring + halo */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] flex items-center justify-center">
                <img
                  src="/GovtLogo.svg"
                  alt="Government of Nepal Logo"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="w-20 h-[2px] rounded-full gold-rule mb-8" />

            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white max-w-xl mx-auto">
              <span className="text-brand-gradient">{t('splashTitle')}</span>
            </h1>
            <p className="font-sans mt-5 text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.32em] leading-relaxed max-w-sm mx-auto text-slate-500 dark:text-slate-400">
              {t('splashSubtext')}
            </p>
          </div>

          {/* Premium Progress Line */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-56 sm:w-64 h-[3px] bg-slate-300/60 dark:bg-slate-700/60 mx-auto overflow-hidden rounded-full">
              <motion.div
                className="h-full rounded-full brand-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-[0.35em] uppercase">
              {String(displayProgress).padStart(3, '0')}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Branding Footer */}
      <div className="pb-10 text-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 1.1 }}
          className="flex flex-col items-center"
        >
          <div className="mb-3 flex items-center justify-center">
            <img
              src="/GovtLogo.svg"
              alt="Government of Nepal Logo"
              className="w-7 h-7 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold text-[#0099DA] dark:text-[#00ADF7] tracking-[0.24em] mb-0.5">{t('govOfNepal')}</p>
          <p className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.20em] mb-0.5">{t('ministryOfPhysical')}</p>
          <p className="font-display text-[12px] sm:text-[13px] font-extrabold text-slate-900 dark:text-white tracking-tight">{t('deptOfRoads')}</p>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-[1px] w-6 bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent" />
              <p className="text-[7px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em]">
                © DOR | 2082/83 B.S
              </p>
            <div className="h-[1px] w-6 bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
