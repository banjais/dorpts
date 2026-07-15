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
      <div className="flex flex-col items-center justify-center gap-10 relative z-10">
        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Emblem medallion */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative flex items-center justify-center"
          >
            <div className="emblem-halo absolute w-48 h-48 rounded-full" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[32px] flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xl shadow-indigo-500/30">
              <div className="absolute -inset-2 rounded-[36px] conic-ring opacity-70 blur-[2px]" />
              <div className="absolute -inset-[3px] rounded-[38px] bg-white/10" />
              <img
                src="/GovtLogo.svg"
                alt="Government of Nepal"
                className="relative w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow"
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
              {t('deptOfRoads')}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 tracking-[0.28em] mt-2.5 uppercase">
              {t('govOfNepal')}
            </p>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-[13px] sm:text-base text-slate-500 dark:text-slate-400 font-medium tracking-wide text-center max-w-md px-6"
        >
          {t('splashSubtext')}
        </motion.p>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="w-64 sm:w-72 flex flex-col items-center gap-3.5"
        >
          <div className="w-full h-[3px] bg-slate-300/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full brand-gradient"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 tracking-[0.35em] uppercase">
            {String(Math.round(progress)).padStart(3, '0')}%
          </span>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute bottom-8 text-[9px] text-slate-500 dark:text-slate-500 tracking-[0.20em] font-semibold uppercase"
      >
        © DOR | 2082/83 B.S
      </motion.p>
    </div>
  );
}
