import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface SplashScreenProps {
  progress: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ progress }) => {
  const { language } = useLanguage();
  const displayProgress = Math.min(100, Math.round(progress));
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
          className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 sm:py-16 text-center">
        {/* App Icon/Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl rotate-6 opacity-50 blur-xl" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight"
        >
          {language === 'en' ? 'DOR Performance' : 'डीओआर कार्यसम्पादन'}
        </motion.h1>

        {/* Sub-header */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-sm sm:text-base text-white/70 mb-8 max-w-md"
        >
          {language === 'en'
            ? 'Real-time monitoring and analytics for Department of Roads'
            : 'सडक विभागको लागि वास्तविक-समय अनुगमन र विश्लेषण'}
        </motion.p>

        {/* Circular Progress */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.8 }}
          className="relative w-40 h-40 sm:w-48 sm:h-48 mb-10"
        >
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${2 * Math.PI * 54}` }}
              animate={{ strokeDasharray: `${2 * Math.PI * 54 * displayProgress / 100} ${2 * Math.PI * 54 * (100 - displayProgress) / 100}` }}
              transition={{ duration: 2, ease: 'easeOut', delay: 1 }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
                className="text-4xl sm:text-5xl font-black text-white"
              >
                {displayProgress}%
              </motion.div>
              <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mt-1">
                {language === 'en' ? 'Overall' : 'समग्र'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Branding - 3 lines at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="space-y-1.5"
        >
          <p className="text-xs font-black text-white/80 uppercase tracking-wider">
            {language === 'en' ? 'Ministry of Physical Infrastructure & Transport' : 'भौतिक बुनियादी ढाँचा र यातायात मन्त्रालय'}
          </p>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
            {language === 'en' ? 'Department of Roads' : 'सडक विभाग'}
          </p>
          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">
            {language === 'en' ? 'Performance Management System' : 'कार्यसम्पादन व्यवस्थापन प्रणाली'}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
