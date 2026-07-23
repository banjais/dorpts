import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface StartupScreenProps {
  onComplete: () => void;
  fiscalYear?: string;
}

export function StartupScreen({ onComplete, fiscalYear }: StartupScreenProps) {
  const [progress, setProgress] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const remaining = 100 - prev;
        const increment = remaining > 50 ? 1.5 : remaining > 20 ? 0.8 : 0.4;
        return Math.min(prev + increment, 100);
      });
    }, 35);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (progress >= 100) {
      timeout = setTimeout(() => {
        onComplete();
      }, 1200);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center font-sans overflow-hidden aurora-bg">
      {/* Center Content */}
      <div className="flex flex-col items-center justify-center gap-8 relative z-10">
        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-5"
        >
          {/* Emblem medallion */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative flex items-center justify-center"
          >
            <div className="emblem-halo absolute w-36 h-36 rounded-full" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xl shadow-indigo-500/30">
              <div className="absolute -inset-2 rounded-[32px] conic-ring opacity-70 blur-[2px]" />
              <div className="absolute -inset-[3px] rounded-[36px] bg-white/10" />
              <img
                src="/GovtLogo.svg"
                alt="Government of Nepal"
                className="relative w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-center"
          >
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0099DA] dark:text-[#00ADF7] shimmer-underline pb-1.5">
              {t('systemTitle')}
            </h1>
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-[0.24em] mt-2 uppercase">
            {t('kpisSubtitle')}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 tracking-wide text-center max-w-xs mt-1">
            {t('splashPurpose')}
          </p>
        </motion.div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="w-64 sm:w-72 flex flex-col items-center gap-3"
        >
          <div className="w-full h-[6px] bg-slate-300/60 dark:bg-slate-700/60 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-[0.3em] uppercase">
            {Math.round(progress)}%
          </span>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute bottom-8 flex flex-col items-center gap-1 text-[9px] text-slate-500 dark:text-slate-500 tracking-[0.20em] font-semibold uppercase"
      >
        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{t('govOfNepal')}</p>
        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{t('ministryOfPhysical')}</p>
        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300">{t('deptOfRoads')}</p>
      </motion.div>
    </div>
  );
}
