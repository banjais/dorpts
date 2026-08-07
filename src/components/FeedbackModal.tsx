import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptic';
import { useAuth } from '../context/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, language }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');
    triggerHaptic('success');
    
    try {
      await addDoc(collection(db, 'user_feedback'), {
        message: feedback.trim(),
        timestamp: serverTimestamp(),
        userEmail: user?.email || null,
        userName: user?.displayName || null,
        userRole: user ? (user.email === 'banjays@gmail.com' ? 'superadmin' : 'user') : 'anonymous',
        source: 'app_feedback',
      });
      setFeedback('');
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setStatus('error');
      setErrorMessage(error?.message || 'Failed to submit feedback');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && status === 'idle') onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Send Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}
              </h3>
              {status === 'idle' && (
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              )}
            </div>
            
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <CheckCircle2 className="text-emerald-500" size={48} />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'Feedback submitted!' : 'प्रतिक्रिया पठाइयो!'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Thank you for your input.' : 'तपाईंको इनपुटका लागि धन्यवाद।'}
                </p>
              </div>
            ) : (
              <>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full h-32 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-sm"
                  placeholder={language === 'en' ? 'Tell us your thoughts or report a bug...' : 'हामीलाई आफ्नो विचार वा बगको बारेमा जानकारी दिनुहोस्...'}
                  disabled={isSubmitting}
                />
                
                {status === 'error' && (
                  <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg px-3 py-2 mb-4">
                    <AlertCircle className="text-rose-500 shrink-0" size={16} />
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{errorMessage}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !feedback.trim()}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
                  {language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

