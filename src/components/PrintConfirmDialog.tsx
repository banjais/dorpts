import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, FileText, Settings, AlertCircle } from 'lucide-react';
import { Indicator } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PrintConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  indicators: Indicator[];
  options: {
    customTitle: string;
    showSummary: boolean;
    viewFormat: string;
  };
}

export const PrintConfirmDialog: React.FC<PrintConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  indicators,
  options
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  // Estimate page count
  // Base summary pages + indicators / items per page
  let estimatedPages = 1; // Cover page + header
  if (options.showSummary) estimatedPages += 1;
  
  if (options.viewFormat === 'card') {
    estimatedPages += Math.ceil(indicators.length / 4);
  } else if (options.viewFormat === 'table') {
    estimatedPages += Math.ceil(indicators.length / 12);
  } else if (options.viewFormat === 'chart') {
    estimatedPages += Math.ceil(indicators.length / 3);
  } else {
    estimatedPages += Math.ceil(indicators.length / 5);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {language === 'en' ? 'Print Confirmation' : 'प्रिन्ट पुष्टि'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-xl text-sm border border-amber-200 dark:border-amber-800/30">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  {language === 'en' 
                    ? "You are about to generate a printable report based on your selected data. Please review the details below."
                    : "तपाईंले चयन गरेको डाटाको आधारमा प्रिन्ट गर्न मिल्ने रिपोर्ट तयार गर्दै हुनुहुन्छ। कृपया तलका विवरणहरू समीक्षा गर्नुहोस्।"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{language === 'en' ? 'Report Title' : 'रिपोर्टको शीर्षक'}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm text-right max-w-[200px] truncate">
                    {options.customTitle || (language === 'en' ? 'Government Progress Report' : 'सरकारी प्रगति रिपोर्ट')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{language === 'en' ? 'Format' : 'ढाँचा'}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm capitalize">
                    {options.viewFormat}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{language === 'en' ? 'Included Indicators' : 'समावेश गरिएका सूचकहरू'}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {indicators.length} {language === 'en' ? 'items' : 'वस्तुहरू'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{language === 'en' ? 'Estimated Pages' : 'अनुमानित पृष्ठहरू'}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-sm">
                    ~{estimatedPages} {language === 'en' ? 'pages' : 'पृष्ठहरू'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {language === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {language === 'en' ? 'Confirm & Print' : 'पुष्टि र प्रिन्ट गर्नुहोस्'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
