import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Chrome, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SUPERADMIN_EMAIL } from '../config/superadmin';

type LoginStep = 'email' | 'otp' | 'loading' | 'success';

export const LoginScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { language } = useLanguage();
  const { loginWithGoogle } = useAuth();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const APP_NAME = language === 'en' ? 'DORPTS' : 'डी.ओ.आर.पी.टी.एस.';
  const APP_SUB = language === 'en' ? 'Performance Tracking System' : 'सम्पादन अनुगमन प्रणाली';

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs[0]?.current?.focus(), 100);
    }
  }, [step]);

  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);
  const [isSuperadminEmail, setIsSuperadminEmail] = useState(false);

   const handleSendOTP = async (e: React.FormEvent) => {
     e.preventDefault();
     setError('');
     setFallbackOtp(null);

     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
       setError(language === 'en' ? 'Enter a valid email address.' : 'वैध इमेल ठेगाना प्रविष्ट गर्नुहोस्।');
       return;
     }

     const isSuper = email.toLowerCase().trim() === SUPERADMIN_EMAIL.toLowerCase().trim();
     if (isSuper) {
       setError(language === 'en' ? 'Superadmin must sign in with Google.' : 'सुपरएडमिन गूगल साइन-इनद्वारा लगइन गर्नुहोस्।');
       return;
     }

     setStep('loading');

     try {
       const { generateAndStoreOTP, requestEmailSend } = await import('../services/otpService');
       const { otp: generatedOtp, otpId } = await generateAndStoreOTP(email);
       try {
         await requestEmailSend(email, generatedOtp);
       } catch (emailErr) {
         console.error('Email send failed, showing fallback OTP:', emailErr);
         setFallbackOtp(generatedOtp);
       }
       setStep('otp');
       setCooldown(30);
     } catch (err) {
       setError(language === 'en' ? 'Failed to send OTP. Try again.' : 'ओटीपी पठाउन सकिएन। पुनः प्रयास गर्नुहोस्।');
       setStep('email');
     }
   };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError(language === 'en' ? 'Enter the 6-digit code.' : '६-अंकको कोड प्रविष्ट गर्नुहोस्।');
      return;
    }

    setStep('loading');
    try {
      const { verifyOTP, createSession } = await import('../services/otpService');
      const valid = await verifyOTP(email, code);

      if (!valid) {
        setError(language === 'en' ? 'Invalid or expired code.' : 'अवैध वा म्याद समाप्त कोड।');
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
        setStep('otp');
        return;
      }

      const token = await createSession(email);
      sessionStorage.setItem('dor_session', token);
      setStep('success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(language === 'en' ? 'Verification failed. Try again.' : 'प्रमाणीकरण असफल। पुनः प्रयास गर्नुहोस्।');
      setStep('otp');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      setError(language === 'en' ? 'Google sign-in failed.' : 'गूगल साइन-इन असफल।');
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(0, 1);
    setOtp(next);
    if (val && idx < 5) {
      otpRefs[idx + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
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
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                onSubmit={handleSendOTP}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                    {language === 'en' ? 'Email Address' : 'इमेल ठेगाना'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                     <input
                       type="email"
                       value={email}
                       onChange={(e) => {
                         setEmail(e.target.value);
                         setIsSuperadminEmail(e.target.value.toLowerCase().trim() === SUPERADMIN_EMAIL.toLowerCase().trim());
                       }}
                       placeholder="you@example.com"
                       autoFocus
                       className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                     />
                   </div>
                 </div>

                 {isSuperadminEmail && (
                   <motion.div
                     initial={{ opacity: 0, y: -5 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3 flex items-center gap-2"
                   >
                     <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                     <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                       {language === 'en' ? 'Superadmin: use Google sign-in only' : 'सुपरएडमिन: गूगल साइन-इन मात्र प्रयोग गर्नुहोस्'}
                     </p>
                   </motion.div>
                 )}

                 <button
                   type="submit"
                   disabled={isSuperadminEmail}
                   className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {language === 'en' ? 'Send OTP Code' : 'ओटीपी कोड पठाउनुहोस्'}
                   <ArrowRight className="w-3.5 h-3.5" />
                 </button>

                 <div className="relative py-1">
                   <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                   </div>
                   <div className="relative flex justify-center">
                     <span className="px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       {language === 'en' ? 'or' : 'वा'}
                     </span>
                   </div>
                 </div>

                 <button
                   type="button"
                   onClick={handleGoogleLogin}
                   className={`w-full py-2.5 border text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSuperadminEmail ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-300'}`}
                 >
                   <Chrome className="w-4 h-4 text-red-500" />
                   {language === 'en' ? 'Sign in with Google' : 'गूगलले साइन इन गर्नुहोस्'}
                 </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                    {language === 'en' ? 'Verification Code' : 'प्रमाणिकरण कोड'}
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    {language === 'en' ? `Sent to ${email}` : `${email} मा पठाइएको`}
                  </p>
                   {fallbackOtp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-4 mb-4 shadow-lg"
                    >
                      <p className="text-[11px] font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider text-center">
                        {language === 'en' ? 'Email service unavailable. Use this code:' : 'इमेल सेवा उपलब्ध छैन। यो कोड प्रयोग गर्नुहोस्:'}
                      </p>
                      <p className="text-3xl font-black text-amber-900 dark:text-amber-100 tracking-[0.3em] text-center font-mono">
                        {fallbackOtp}
                      </p>
                    </motion.div>
                  )}
                  <div className="flex gap-1.5 justify-between">
                    {otpRefs.map((ref, i) => (
                      <input
                        key={i}
                        ref={ref}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i]}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 h-11 text-center text-lg font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={cooldown > 0}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
                  >
                    {language === 'en' ? 'Verify' : 'प्रमाणित'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={cooldown > 0}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                  >
                    {cooldown > 0 ? `${cooldown}s` : language === 'en' ? 'Resend' : 'पुनः पठाउनुहोस्'}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Please wait...' : 'कृपया पर्खनुहोस्...'}
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 gap-2"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-1">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Welcome!' : 'स्वागत छ!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
        </div>

        <p className="text-center text-[9px] text-slate-400 dark:text-slate-500 mt-4 font-medium">
          {language === 'en'
            ? 'By signing in, you agree to the Department of Roads guidelines.'
            : 'साइन इन गरेर तपाईं सडक विभाग दिगो निर्देशिकामा सहमति जनाउनुभयो।'}
        </p>
      </motion.div>
    </div>
  );
};
