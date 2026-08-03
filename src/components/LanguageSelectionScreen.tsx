import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectionScreenProps {
  onComplete: (lang: 'en' | 'ne') => void;
}

export function LanguageSelectionScreen({ onComplete }: LanguageSelectionScreenProps) {
  const [selected, setSelected] = useState<'en' | 'ne' | null>(null);

  const handleSelect = (lang: 'en' | 'ne') => {
    setSelected(lang);
    setTimeout(() => {
      onComplete(lang);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center font-sans overflow-hidden bg-white dark:bg-slate-950">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-400/10 dark:to-purple-400/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full blur-3xl" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shadow-lg shadow-indigo-500/10"
        >
          <Globe className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </motion.div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Select Language
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Choose your preferred language to continue
          </p>
        </div>

        {/* Language Options */}
        <div className="w-full space-y-3">
          {/* English */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('en')}
            className={`relative w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${
              selected === 'en'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div className="text-left">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  English
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Default
                </div>
              </div>
            </div>
            {selected === 'en' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>

          {/* Nepali */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('ne')}
            className={`relative w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${
              selected === 'ne'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇳🇵</span>
              <div className="text-left">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  नेपाली
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Native
                </div>
              </div>
            </div>
            {selected === 'ne' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
