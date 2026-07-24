import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chrome, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { language } = useLanguage();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const APP_NAME = language === 'en' ? 'DORPTS' : 'डी.ओ.आर.पी.टी.एस.';
  const APP_SUB = language === 'en' ? 'Performance Tracking System' : 'सम्पादन अनुगमन प्रणाली';

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in failed.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const isRTL = language === 'ne';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-[#0b1329] p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="w-full max-w-sm"
      >
        {onClose && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="text-white w-7 h-7" strokeWidth={2} />
          </div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{APP_SUB}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl shadow-black/5 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/50">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">
                {language === 'en' ? 'Sign in to access the system' : 'प्रणालीमा प्रवेश गर्न साइन इन गर्नुहोस्'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {language === 'en' 
                  ? 'Superadmin and admins use Google sign-in. Normal users can also sign in for comments and feedback.'
                  : 'सुपरएडमिन र प्रशासकहरू गूगल साइन-इन प्रयोग गर्छन्। सामान्य प्रयोगकर्ताहरू पनि टिप्पणी र प्रतिक्रियाको लागि साइन इन गर्न सक्छन्।'
                }
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              <span>{language === 'en' ? 'Sign in with Google' : 'गूगलले साइन इन गर्नुहोस्'}</span>
            </button>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{language === 'en' ? 'Redirecting to Google...' : 'गूगलमा रिडाइरेक्ट हुँदै...'}</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2"
            >
              <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] font-medium text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[9px] text-slate-400 dark:text-slate-500 mt-4 font-medium">
          {language === 'en'
            ? 'By signing in, you agree to the Department of Roads guidelines.'
            : 'साइन इन गरेर तपाईं सडक विभाग दिगो निर्देशिकामा सहमति जनाउनुभयो।'}
        </p>
      </motion.div>
    </div>
  );
};
