import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StatusGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusGuideModal: React.FC<StatusGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              {t('statusGuide')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Target size={20} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('onTrackCriteria')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('atRiskCriteria')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
                <Clock size={20} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('delayedCriteria')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
