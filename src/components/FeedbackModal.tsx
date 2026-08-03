import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptic';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, language }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    triggerHaptic('success');
    
    try {
      await addDoc(collection(db, 'user_feedback'), {
        message: feedback,
        timestamp: serverTimestamp(),
        // Add user info if available, but keep it simple as per instructions
      });
      setFeedback('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Could add toast notification here if available
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{language === 'en' ? 'Send Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}</h3>
              <button onClick={onClose}><X size={20} /></button>
            </div>
            
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-32 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={language === 'en' ? 'Tell us your thoughts or report a bug...' : 'हामीलाई आफ्नो विचार वा बगको बारेमा जानकारी दिनुहोस्...'}
            />
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
              {language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
